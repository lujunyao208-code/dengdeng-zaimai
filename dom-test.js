/**
 * DOM 集成冒烟测试（开发用，发布时随 test/ 一起移除）
 * 运行：NODE_PATH=<jsdom安装目录>/node_modules node test/dom-test.js
 * 覆盖：页面切换 / 手动添加全流程（4问含欲望滑块）/ 图片上传Mock识别（含价格不确定）/ 决策流转 / 统计联动 / 筛选 / 编辑资料页 / 设置子页面 / 四因素冷静期算法
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const appDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(appDir, 'index.html'), 'utf8');
const scripts = ['js/config.js', 'js/store.js', 'js/ocr.js', 'js/icons.js', 'js/ui.js',
  'js/pages/items.js', 'js/pages/add.js', 'js/pages/detail.js', 'js/pages/profile.js', 'js/pages/settings.js', 'js/app.js'];

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('  OK  ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

async function boot(seed) {
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.scrollTo = function () {};
  if (seed) w.localStorage.setItem('dengdeng.zaimai.v1', JSON.stringify(seed));
  scripts.forEach(function (s) {
    w.eval(fs.readFileSync(path.join(appDir, s), 'utf8'));
  });
  // 等待 DOMContentLoaded 派发 + 应用完成首次渲染（jsdom 异步派发）
  await new Promise(function (r) { setTimeout(r, 60); });
  return w;
}
function tick(w, ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function fire(w, el) {
  el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
}
async function nav(w, el) {
  fire(w, el);
  await tick(w, 80); // hashchange 在 jsdom 中是异步派发的
}
function setInput(w, el, v) {
  el.value = v;
  el.dispatchEvent(new w.Event('input', { bubbles: true }));
}
const q = function (w, sel) { return w.document.querySelector(sel); };
const qa = function (w, sel) { return Array.from(w.document.querySelectorAll(sel)); };
/** 点击指定答案的选项 */
function pickOpt(w, answer) {
  const target = qa(w, '.opt').find(function (o) { return o.getAttribute('data-answer') === answer; });
  fire(w, target);
}

(async function () {
  console.log('--- 用例1: 空应用启动，三个一级页面可切换 ---');
  const w1 = await boot();
  ok('我的物品标题渲染', q(w1, '.h-title') && q(w1, '.h-title').textContent.includes('等等再买'));
  ok('空状态显示', !!q(w1, '.empty'));
  await nav(w1, q(w1, '.tab[data-route="add"]'));
  ok('切到添加页', q(w1, '.upload-box') !== null);
  await nav(w1, q(w1, '.tab[data-route="profile"]'));
  ok('切到我的页', q(w1, '.profile-head') !== null);
  ok('我的页统计为0', q(w1, '.sc-spent .sc-value').textContent === '¥0');

  console.log('--- 用例2: 手动添加商品 → 一次一个问题（4问，含欲望滑块）→ 结果页只给结论 → 开始冷静 ---');
  const w2 = await boot();
  await nav(w2, q(w2, '.tab[data-route="add"]'));
  fire(w2, q(w2, '[data-act="toggle-manual"]'));
  ok('手动表单展开', !!q(w2, '#m-name'));
  setInput(w2, q(w2, '#m-name'), '测试口红');
  setInput(w2, q(w2, '#m-price'), '300');
  fire(w2, q(w2, '.cat-chip[data-cat="美妆"]'));
  fire(w2, q(w2, '[data-act="manual-submit"]'));
  ok('进入问题流', !!q(w2, '.q-title'));
  ok('每次只显示1个问题', qa(w2, '.q-title').length === 1);
  ok('第1问文案正确（预计会用多久）', q(w2, '.q-title').textContent.indexOf('会用多久') >= 0);
  ok('进度点4个', qa(w2, '.q-dot').length === 4);
  ok('顶部不再显示心形图标', !!q(w2, '.h-hand') && !q(w2, '.h-hand .ico'));

  // Q1/Q2：3个月左右 × 每周1–2次 = 6×3 = 18次；300÷18 ≈ 16.67
  pickOpt(w2, '3个月左右');
  await tick(w2, 800);
  pickOpt(w2, '每周1–2次');
  await tick(w2, 800);

  // Q3：购买欲望滑块
  ok('第3问文案正确（购买欲望）', q(w2, '.q-title').textContent.indexOf('有多想买') >= 0);
  ok('第3问是滑块', !!q(w2, '#desire-range'));
  ok('滑块默认70%', q(w2, '#desire-val').textContent === '70%');
  ok('滑块两端有尺度标签', q(w2, '.qs-scale').textContent.indexOf('没那么想买') >= 0 && q(w2, '.qs-scale').textContent.indexOf('超级想买') >= 0);
  setInput(w2, q(w2, '#desire-range'), '40');
  ok('滑块数值联动显示40%', q(w2, '#desire-val').textContent === '40%');
  fire(w2, q(w2, '[data-act="slider-ok"]'));
  await tick(w2, 500);

  // Q4：使用场景
  ok('第4问文案正确（使用场景）', q(w2, '.q-title').textContent.indexOf('什么情况下使用') >= 0);
  ok('场景选项带补充说明', qa(w2, '.opt-note').length === 3);
  pickOpt(w2, '暂时没有明确场景');
  await tick(w2, 2000); // 等选项过渡 + 计算中结束

  // 结果页：只给结论，不给计算过程
  ok('结果页出现', !!q(w2, '[data-act="start-cooling"]'));
  ok('不展示计算过程明细', !q(w2, '.rc-bd') && !q(w2, '.rc-explain'));
  ok('评价语显示（有点贵，可以再想想）', q(w2, '.rc-verdict').textContent.indexOf('有点贵，可以再想想') >= 0);
  ok('冷静期显示 2 天', q(w2, '.rc-days').textContent.indexOf('2') >= 0);
  ok('一句话结论（两天后）', q(w2, '.rc-sentence').textContent.indexOf('两天后，再决定要不要买。') >= 0);

  fire(w2, q(w2, '[data-act="start-cooling"]'));
  await tick(w2, 120);
  ok('回到我的物品', w2.location.hash === '#/items');
  const card2 = q(w2, '.product-card');
  ok('商品出现在列表', !!card2);
  ok('卡片带冷静徽章', card2.querySelector('.pc-badge').textContent.indexOf('冷静中') >= 0);
  ok('卡片价格显示约数 约 ¥300', card2.querySelector('.pc-price').textContent === '约 ¥300');
  ok('冷静期小时数正确(48h)', w2.eval('Store.getProduct("' + card2.getAttribute('data-id') + '").coolingPeriodHours') === 48);
  ok('商品记录购买欲望40', w2.eval('Store.getProduct("' + card2.getAttribute('data-id') + '").desire') === 40);
  ok('商品记录使用场景', w2.eval('Store.getProduct("' + card2.getAttribute('data-id') + '").scenario') === '暂时没有明确场景');
  await nav(w2, q(w2, '.tab[data-route="add"]'));
  ok('再次进入添加页是全新状态', !!q(w2, '.upload-box'));

  console.log('--- 用例3: 图片上传 → Mock 识别 → 确认 ---');
  const w3 = await boot();
  w3.eval(
    'UI.readImageFile = function(){ return Promise.resolve("data:image/jpeg;base64,FAKEIMG=" + Date.now()); };' +
    'OCRService.recognize = function(){ return new Promise(function(r){ setTimeout(function(){ r({ name:"识别出的帆布包", price:129, category:"服饰", confidence:92 }); }, 300); }); };'
  );
  await nav(w3, q(w3, '.tab[data-route="add"]'));
  const input3 = q(w3, '#file-input');
  Object.defineProperty(input3, 'files', { value: [{ type: 'image/jpeg', name: 'x.jpg' }] });
  input3.dispatchEvent(new w3.Event('change', { bubbles: true }));
  await tick(w3, 120);
  ok('识别中状态出现', q(w3, '.rec-text') !== null);
  await tick(w3, 400);
  ok('识别完成进入确认', !!q(w3, '#c-name'));
  ok('识别结果填入名称', q(w3, '#c-name').value === '识别出的帆布包');
  ok('价格核对提示显示', !!q(w3, '.price-note') && q(w3, '.price-note').textContent.indexOf('实际售价') >= 0);
  setInput(w3, q(w3, '#c-name'), '帆布包');
  setInput(w3, q(w3, '#c-price'), '129');
  fire(w3, q(w3, '[data-act="confirm-ok"]'));
  ok('确认后进入问题流', !!q(w3, '.q-title'));

  console.log('--- 用例3b: 识别不确定价格 → 不编造 → 手动补价 ---');
  const w3b = await boot();
  w3b.eval(
    'UI.readImageFile = function(){ return Promise.resolve("data:image/jpeg;base64,FAKEIMG2=" + Date.now()); };' +
    'OCRService.recognize = function(){ return new Promise(function(r){ setTimeout(function(){ r({ name:"运动鞋", price:null, category:"服饰", confidence:90, priceNote:"暂未确定准确价格，请确认" }); }, 300); }); };'
  );
  await nav(w3b, q(w3b, '.tab[data-route="add"]'));
  const input3b = q(w3b, '#file-input');
  Object.defineProperty(input3b, 'files', { value: [{ type: 'image/jpeg', name: 'x.jpg' }] });
  input3b.dispatchEvent(new w3b.Event('change', { bubbles: true }));
  await tick(w3b, 500);
  ok('不确定价格时留空不编造', q(w3b, '#c-price').value === '');
  ok('价格待确认提示', q(w3b, '.price-note').textContent.indexOf('暂未确定准确价格') >= 0);
  ok('类别识别优先恢复为通用名', q(w3b, '#c-name').value === '运动鞋');
  setInput(w3b, q(w3b, '#c-price'), '459');
  fire(w3b, q(w3b, '[data-act="confirm-ok"]'));
  ok('手动补价格后可继续', !!q(w3b, '.q-title'));

  console.log('--- 用例4: 冷静期结束 → 决策 → 统计联动 ---');
  const now4 = Date.now();
  const w4 = await boot({
    version: 1,
    user: { nickname: '瑶瑶', avatar: '🎀', tagline: '今天也少买一点点' },
    products: [{
      id: 'p_test', name: '想买的包', price: 500, image: null, category: '服饰',
      source: 'manual', createdAt: new Date(now4 - 4 * 864e5).toISOString(),
      expectedUsage: 52, costPerUse: 9.62, coolingPeriodHours: 72,
      coolingStartedAt: new Date(now4 - 4 * 864e5).toISOString(),
      coolingEndAt: new Date(now4 - 864e5).toISOString(),
      status: 'cooling', hesitationCount: 0,
      answers: [{ q: '你觉得自己多久会用一次它？', a: '每周一次' }],
      history: [{ at: new Date(now4 - 4 * 864e5).toISOString(), text: '开始冷静' }],
    }],
  });
  w4.eval('Store.load(); App.render(true);');
  ok('到期横幅出现', !!q(w4, '.notice-banner'));
  ok('卡片显示可决定徽章', q(w4, '.pc-badge').textContent.indexOf('可以决定') >= 0);
  await nav(w4, q(w4, '.product-card'));
  ok('进入详情页', !!q(w4, '.decide-card'));
  ok('详情有3个决策按钮', qa(w4, '.decide-btn').length === 3);
  ok('详情单次成本显示约数 约 ¥10/次', q(w4, '.kv-list').textContent.indexOf('约 ¥10/次') >= 0);
  ok('详情价格显示约数 约 ¥500', q(w4, '.dh-price').textContent.indexOf('约 ¥500') >= 0);
  fire(w4, q(w4, '.decide-btn[data-decide="abandoned"]'));
  ok('决定后显示已放弃', q(w4, '.final-result').textContent.indexOf('已放弃') >= 0);
  ok('详情显示省下金额', q(w4, '.final-result').textContent.indexOf('¥500') >= 0);
  await nav(w4, q(w4, '.tab[data-route="profile"]'));
  ok('我的页-已花费¥0', q(w4, '.sc-spent .sc-value').textContent === '¥0');
  ok('我的页-省下¥500', q(w4, '.sc-saved .sc-value').textContent === '¥500');
  ok('我的页-最终放弃1件', qa(w4, '.rg-item').some(function (el) {
    return el.textContent.indexOf('最终放弃') >= 0 && el.textContent.indexOf('1件') >= 0;
  }));
  ok('旧昵称「瑶瑶」已迁移', q(w4, '.ph-name').textContent === '昵称');

  console.log('--- 用例5: 再冷静一次流转 ---');
  const w5 = await boot(JSON.parse(w4.localStorage.getItem('dengdeng.zaimai.v1')));
  w5.eval('Store.load(); App.render(true);');
  w5.eval(
    'var p = Store.getProduct("p_test");' +
    'p.status = "cooling"; p.decidedAt = null; p.decidedAction = null;' +
    'p.coolingEndAt = new Date(Date.now() - 1000).toISOString();'
  );
  w5.location.hash = '#/detail/p_test';
  await tick(w5, 80);
  fire(w5, q(w5, '.decide-btn[data-decide="hesitate"]'));
  ok('犹豫后再冷静中', q(w5, '.cool-progress').textContent.indexOf('再冷静中') >= 0);
  ok('重新倒计时', q(w5, '.cp-time').textContent.indexOf('还剩') >= 0);

  console.log('--- 用例6: 示例数据 + 筛选 + 编辑资料页 ---');
  const w6 = await boot();
  w6.eval('Store.addSampleData(); App.render(true);');
  ok('示例数据4件', qa(w6, '.product-card').length === 4);
  fire(w6, q(w6, '.chip[data-filter="cooling"]'));
  ok('冷静中筛选2件', qa(w6, '.product-card').length === 2);
  fire(w6, q(w6, '.chip[data-filter="bought"]'));
  ok('已购买筛选1件', qa(w6, '.product-card').length === 1);
  fire(w6, q(w6, '.chip[data-filter="abandoned"]'));
  ok('已放弃筛选1件', qa(w6, '.product-card').length === 1);
  await nav(w6, q(w6, '.tab[data-route="profile"]'));
  ok('偏好统计出现', qa(w6, '.pref-row').length >= 2);
  await nav(w6, q(w6, '[data-act="edit"]'));
  ok('进入编辑资料页', q(w6, '.dh-title').textContent.indexOf('编辑资料') >= 0);
  ok('编辑页有昵称输入框', !!q(w6, '#edit-nickname'));
  ok('编辑页有推荐头像8个', qa(w6, '.avatar-opt').length === 8);
  ok('头像上传入口在编辑页', !!q(w6, '[data-act="pick-file"]'));
  const flower6 = qa(w6, '.avatar-opt').find(function (el) {
    return el.getAttribute('data-avatar') === 'flower';
  });
  fire(w6, flower6);
  ok('推荐头像被选中', flower6.classList.contains('selected'));
  setInput(w6, q(w6, '#edit-nickname'), '小满');
  fire(w6, q(w6, '[data-act="save"]'));
  await tick(w6, 100);
  ok('保存后回到我的页', !!q(w6, '.profile-head'));
  ok('昵称已更新', q(w6, '.ph-name').textContent.indexOf('小满') >= 0);
  ok('头像已更新', q(w6, '.avatar').getAttribute('data-avatar') === 'flower');

  console.log('--- 用例7: 设置子页面 + 关于页 + 清空确认 ---');
  const w7 = await boot();
  w7.eval('Store.addSampleData(); App.render(true);');
  await nav(w7, q(w7, '.product-card'));
  ok('从列表进入详情', !!q(w7, '.detail-head'));
  await nav(w7, q(w7, '[data-act="back"]'));
  ok('返回列表', !!q(w7, '.chips'));
  await nav(w7, q(w7, '.tab[data-route="profile"]'));
  ok('设置页无「通知设置」入口', qa(w7, '.set-row').every(function (el) { return el.textContent.indexOf('通知设置') < 0; }));
  await nav(w7, q(w7, '.set-row[data-set="cooling"]'));
  ok('冷静期偏好页打开，3个模式', qa(w7, '.set-opt').length === 3);
  ok('偏好页新文案（偏向哪种方式）', q(w7, '.card-title').textContent.indexOf('你希望自己购物时更偏向哪种方式？') >= 0);
  ok('三个模式文案正确', q(w7, '.set-opt[data-mode="relaxed"]').textContent.indexOf('真的想买就别等太久') >= 0 &&
    q(w7, '.set-opt[data-mode="standard"]').textContent.indexOf('给自己一点时间想清楚') >= 0 &&
    q(w7, '.set-opt[data-mode="cautious"]').textContent.indexOf('希望多考虑一下再决定') >= 0);
  ok('默认选中标准', q(w7, '.set-opt[data-mode="standard"]').classList.contains('selected'));
  ok('页面脚注说明偏好只是调整方向', q(w7, '.set-foot').textContent.indexOf('更偏向宽松或谨慎') >= 0);
  fire(w7, q(w7, '.set-opt[data-mode="cautious"]'));
  await tick(w7, 80);
  ok('更谨慎已选中', q(w7, '.set-opt[data-mode="cautious"]').classList.contains('selected'));
  ok('偏好已保存', w7.eval('Store.getUser().coolingMode') === 'cautious');
  await nav(w7, q(w7, '.detail-head [data-act="back"]'));
  ok('偏好页返回我的页', !!q(w7, '.profile-head'));
  await nav(w7, q(w7, '.set-row[data-set="account"]'));
  ok('账号与安全页打开', !!q(w7, '.kv-list'));
  ok('当前账号为本地体验模式', q(w7, '.kv-list').textContent.indexOf('本地体验模式') >= 0);
  ok('手机号登录暂未开启', q(w7, '.kv-list').textContent.indexOf('暂未开启') >= 0);
  await nav(w7, q(w7, '.detail-head [data-act="back"]'));
  ok('账号页返回我的页', !!q(w7, '.profile-head'));
  await nav(w7, q(w7, '.set-row[data-set="about"]'));
  ok('关于页打开', !!q(w7, '.dev-btn'));
  fire(w7, q(w7, '[data-dev="clear"]'));
  await tick(w7, 100);
  ok('清空需确认弹窗', qa(w7, '.sheet .btn').length >= 2);
  fire(w7, qa(w7, '.sheet [data-act="ok"]')[0]);
  await tick(w7, 1100);
  ok('清空后列表为空', qa(w7, '.product-card').length === 0);

  console.log('--- 用例8: 四因素冷静期算法 / 偏好映射 / 约数展示 ---');
  const w8 = await boot();
  w8.eval('window.__calc = (function(){ function days(p,c,d,sc){ return CONFIG.computeCoolingDays(p,c,d,sc); }' +
    ' return {' +
    ' a1: days(300,20,50,"日常使用"), a2: days(40,20,50,"日常使用"),' +
    ' d1: days(300,20,70,"日常使用"), d2: days(300,20,90,"日常使用"),' +
    ' sc1: days(300,20,50,"特定场景"), sc2: days(300,20,50,"暂时没有明确场景"),' +
    ' mx: days(2000,2000,50,"日常使用"), mn: days(20,10,100,"特定场景"),' +
    ' u1: CONFIG.expectedUsageFor("3个月左右","每周1–2次"), u2: CONFIG.expectedUsageFor("1周左右","每天"),' +
    ' u3: CONFIG.expectedUsageFor("1周左右","偶尔使用"), u4: CONFIG.expectedUsageFor("1年左右","每天"),' +
    ' u5: CONFIG.expectedUsageFor("1个月左右","每月几次"),' +
    ' m1: CONFIG.adjustCoolingDays(5,"relaxed"), m2: CONFIG.adjustCoolingDays(1,"relaxed"), m3: CONFIG.adjustCoolingDays(2,"relaxed"),' +
    ' m4: CONFIG.adjustCoolingDays(1,"cautious"), m5: CONFIG.adjustCoolingDays(5,"cautious"), m6: CONFIG.adjustCoolingDays(2,"standard"),' +
    ' p1: CONFIG.approxPrice(299), p2: CONFIG.approxPrice(198), p3: CONFIG.approxPrice(49), p4: CONFIG.approxPrice(1299), p5: CONFIG.approxPrice(9),' +
    ' c1: CONFIG.approxCost(5.537), c2: CONFIG.approxCost(13.2), c3: CONFIG.approxCost(26.8), c4: CONFIG.approxCost(20)' +
    ' }; })();');
  const c8 = w8.__calc;
  ok('情况A: 300元/15次/欲望50/日常 → 2天', c8.a1 === 2);
  ok('情况B: 40元/2次/欲望50/日常 → 1天', c8.a2 === 1);
  ok('欲望61–80%: 2天 → 1天', c8.d1 === 1);
  ok('欲望81–100%: 2天 → 0天', c8.d2 === 0);
  ok('特定场景: 2天 → 1天', c8.sc1 === 1);
  ok('无明确场景: 不加不减 → 2天', c8.sc2 === 2);
  ok('上限: 2000元/超贵单次 → 5天', c8.mx === 5);
  ok('下限: 负数结果 → 0天', c8.mn === 0);
  ok('次数: 3个月左右×每周1–2次 = 18', c8.u1 === 18);
  ok('次数: 1周左右×每天 = 8（7.5四舍五入）', c8.u2 === 8);
  ok('次数下限: 1周左右×偶尔使用 = 1', c8.u3 === 1);
  ok('次数: 1年左右×每天 = 360', c8.u4 === 360);
  ok('次数: 1个月左右×每月几次 = 3', c8.u5 === 3);
  ok('偏好-宽松: 5天→4天', c8.m1 === 4);
  ok('偏好-宽松: 1天→0天', c8.m2 === 0);
  ok('偏好-宽松: 2天→1天', c8.m3 === 1);
  ok('偏好-谨慎: 1天→2天', c8.m4 === 2);
  ok('偏好-谨慎: 5天→5天', c8.m5 === 5);
  ok('偏好-标准: 2天不变', c8.m6 === 2);
  ok('约数-价格: 299 → 300', c8.p1 === 300);
  ok('约数-价格: 198 → 200', c8.p2 === 200);
  ok('约数-价格: 49 → 50', c8.p3 === 50);
  ok('约数-价格: 1299 → 1300', c8.p4 === 1300);
  ok('约数-价格: 9 → 9（<10不取整）', c8.p5 === 9);
  ok('约数-单次: 5.537 → 6', c8.c1 === 6);
  ok('约数-单次: 13.2 → 13', c8.c2 === 13);
  ok('约数-单次: 26.8 → 27', c8.c3 === 27);
  ok('约数-单次: 20 → 20', c8.c4 === 20);
  ok('展示: 299 → 约 ¥300', w8.eval('UI.approxPrice(299)') === '约 ¥300');
  ok('展示: 1299 → 约 ¥1,300', w8.eval('UI.approxPrice(1299)') === '约 ¥1,300');
  ok('展示: 5.537 → 约 ¥6/次', w8.eval('UI.approxCost(5.537)') === '约 ¥6/次');
  ok('结论-冲动', w8.eval('CONFIG.verdictFor(300,20,90,"暂时没有明确场景").title') === '可能有点冲动');
  ok('结论-值得', w8.eval('CONFIG.verdictFor(300,4,50,"日常使用").title') === '看起来比较值得');
  ok('结论-小件', w8.eval('CONFIG.verdictFor(80,6,50,"日常使用").title') === '可以考虑一下');
  ok('结论-偏贵', w8.eval('CONFIG.verdictFor(300,20,50,"日常使用").title') === '有点贵，可以再想想');

  console.log('');
  console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})().catch(function (e) {
  console.error('测试异常:', e);
  process.exit(1);
});
