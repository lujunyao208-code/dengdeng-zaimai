/**
 * ============================================================
 * 数据层 —— 本地存储 + 数据模型 + 统计计算
 *
 * 数据结构：
 * {
 *   version: 1,
 *   user: { nickname, avatar, tagline },
 *   products: [{
 *     id, name, price, image(dataURL|null), category,
 *     source: 'image' | 'manual' | 'demo',
 *     createdAt,            // 添加时间
 *     expectedUsage,        // 预计使用次数（次/年）
 *     costPerUse,           // 单次使用成本
 *     coolingPeriodHours,   // 冷静时长（小时）
 *     coolingStartedAt,     // 当前这一轮冷静开始时间
 *     coolingEndAt,         // 当前这一轮冷静结束时间
 *     status: 'cooling' | 'bought' | 'abandoned' | 'hesitating',
 *     decidedAt, decidedAction,
 *     hesitationCount,
 *     answers: [{ q, a }],
 *     history: [{ at, text }]
 *   }]
 * }
 *
 * 「我的」页面的统计数据全部由 products 实时推导，不单独存储，
 * 保证任何操作后统计自动保持一致。
 *
 * 以后接入后端时：把下面每个读写方法替换为 API 调用即可。
 * ============================================================
 */
window.Store = (function () {

  var KEY = 'dengdeng.zaimai.v1';
  var HOUR = 3600 * 1000;
  var DAY = 24 * HOUR;
  var data = null;

  function defaults() {
    return {
      version: 1,
      user: {
        nickname: '昵称',
        avatar: 'bear',           // 默认头像图标 key（js/icons.js）
        avatarImage: null,        // 用户自上传头像 dataURL（本地保存，优先于 avatar 显示）
        coolingMode: 'standard',  // 冷静期偏好：standard | cautious | relaxed
        tagline: '今天也少买一点点',
      },
      products: [],
    };
  }

  function load() {
    if (data) return data;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        data = JSON.parse(raw);
        // 简单容错：字段补全
        if (!data || typeof data !== 'object') data = defaults();
        if (!data.user) data.user = defaults().user;
        if (!data.products) data.products = [];
        if (!data.version) data.version = 1;
        // 旧版本默认昵称为「瑶瑶」，统一迁移为通用昵称
        if (data.user && data.user.nickname === '瑶瑶') data.user.nickname = '昵称';
        // 旧版本头像为 emoji，统一迁移为线稿图标 key（与 js/icons.js 对应）
        var AVATAR_KEYS = ['flower', 'bear', 'bunny', 'star', 'moon', 'heart', 'leaf', 'clover'];
        var AVATAR_MAP = {
          '🎀': 'flower', '🌸': 'flower', '🐰': 'bunny', '🍑': 'heart', '⭐': 'star',
          '🌙': 'moon', '🍓': 'heart', '🦋': 'flower', '🐻': 'bear', '🧸': 'bear',
          '💗': 'heart', '🍀': 'clover',
        };
        if (data.user && AVATAR_KEYS.indexOf(data.user.avatar) < 0) {
          data.user.avatar = AVATAR_MAP[data.user.avatar] || 'bear';
        }
        // V1.1 新增字段补全：冷静期偏好 / 上传头像
        if (data.user) {
          if (data.user.coolingMode !== 'standard' && data.user.coolingMode !== 'cautious' && data.user.coolingMode !== 'relaxed') {
            data.user.coolingMode = 'standard';
          }
          if (data.user.avatarImage == null) data.user.avatarImage = null;
        }
      }
    } catch (e) {
      // 存储不可用或数据损坏时，从默认值重新开始
      console.warn('本地数据读取失败，使用默认数据', e);
    }
    if (!data) data = defaults();
    return data;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      // 超出存储配额时提示（多为图片过大），但不中断操作
      console.warn('保存失败（可能是本地存储空间不足）', e);
      if (typeof window !== 'undefined' && window.UI) {
        window.UI.toast('保存失败，本地存储空间可能不足');
      }
    }
  }

  function uid() {
    return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---------- 用户 ---------- */
  function getUser() { return load().user; }
  function updateUser(patch) {
    Object.assign(load().user, patch);
    save();
  }

  /* ---------- 商品 ---------- */
  /** 全部商品，按添加时间倒序 */
  function getProducts() {
    return load().products.slice().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }
  function getProduct(id) {
    var list = load().products;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function addProduct(p) {
    p.id = uid();
    load().products.push(p);
    save();
    return p;
  }
  function updateProduct(id, patch) {
    var p = getProduct(id);
    if (p) { Object.assign(p, patch); save(); }
    return p;
  }
  function clearAll() {
    data = defaults();
    save();
  }

  /* ---------- 时间与状态 ---------- */
  function now() { return Date.now(); }

  /** 剩余冷静时间 */
  function remaining(p) {
    if (!p.coolingEndAt) return { over: true, ms: 0, days: 0, hours: 0, minutes: 0 };
    var left = new Date(p.coolingEndAt).getTime() - now();
    if (isNaN(left) || left <= 0) return { over: true, ms: 0, days: 0, hours: 0, minutes: 0 };
    return {
      over: false,
      ms: left,
      days: Math.floor(left / DAY),
      hours: Math.floor((left % DAY) / HOUR),
      minutes: Math.floor((left % HOUR) / 60000),
    };
  }

  function isInCooling(p) { return p.status === 'cooling' || p.status === 'hesitating'; }

  /** 冷静期是否已结束（等待用户做决定） */
  function isCoolingOver(p) { return isInCooling(p) && remaining(p).over; }

  /** 当前这一轮冷静已进行的天数（含小数，用于累计冷静时间） */
  function coolingDaysElapsed(p) {
    var start = new Date(p.coolingStartedAt || p.createdAt).getTime();
    var full = (p.coolingPeriodHours || 0) * HOUR;
    if (!full) return 0;
    var elapsed = Math.min(now() - start, full) / DAY;
    return Math.max(0, elapsed);
  }

  /* ---------- 决策 ---------- */
  /**
   * 冷静期结束后的决定
   * action: 'bought' 已购买 | 'abandoned' 已放弃 | 'hesitate' 再冷静一次
   */
  function decide(p, action) {
    var t = new Date().toISOString();
    p.history = p.history || [];
    if (action === 'bought') {
      p.status = 'bought';
      p.decidedAt = t;
      p.decidedAction = 'bought';
      p.history.push({ at: t, text: '冷静结束，决定购买' });
    } else if (action === 'abandoned') {
      p.status = 'abandoned';
      p.decidedAt = t;
      p.decidedAction = 'abandoned';
      p.history.push({ at: t, text: '冷静结束，决定放弃' });
    } else if (action === 'hesitate') {
      // 再冷静一次：开启新一轮相同时长的冷静期
      p.hesitationCount = (p.hesitationCount || 0) + 1;
      p.coolingStartedAt = t;
      p.coolingEndAt = new Date(now() + (p.coolingPeriodHours || 0) * HOUR).toISOString();
      p.status = 'hesitating';
      p.history.push({ at: t, text: '还在犹豫，再冷静一次' });
    }
    save();
  }

  /* ---------- 统计（由 products 实时推导） ---------- */
  function computeStats() {
    var products = load().products;
    var s = {
      totalSpent: 0,        // 已花费：最终决定购买的商品总金额
      totalNotSpent: 0,     // 没花的钱：最终放弃的商品原价总和
      totalSaved: 0,        // 为自己省下：同「没花的钱」（PRD 中两卡同源）
      cooledCount: 0,       // 已冷静商品数量（所有添加的商品都会进入冷静期）
      totalCoolingDays: 0,  // 累计冷静时间（天）
      avgCoolingDays: 0,    // 平均冷静时间
      boughtCount: 0,       // 最终购买数量
      abandonedCount: 0,    // 最终放弃数量
      categoryList: [],     // 消费偏好 [{ category, count, pct }]
    };
    var catCount = {};

    products.forEach(function (p) {
      if (p.status === 'bought') { s.totalSpent += p.price; s.boughtCount++; }
      if (p.status === 'abandoned') { s.totalNotSpent += p.price; s.abandonedCount++; }

      s.cooledCount++;

      // 累计冷静时间：已决定的按完整冷静期计；仍在冷静中的按已进行时间计
      if (p.status === 'bought' || p.status === 'abandoned') {
        s.totalCoolingDays += (p.coolingPeriodHours || 0) / 24;
      } else if (p.status === 'cooling' || p.status === 'hesitating') {
        s.totalCoolingDays += coolingDaysElapsed(p);
      }

      catCount[p.category] = (catCount[p.category] || 0) + 1;
    });

    s.totalSaved = s.totalNotSpent;
    s.avgCoolingDays = s.cooledCount ? s.totalCoolingDays / s.cooledCount : 0;

    Object.keys(catCount).forEach(function (c) {
      s.categoryList.push({
        category: c,
        count: catCount[c],
        pct: Math.round((catCount[c] / s.cooledCount) * 100),
      });
    });
    s.categoryList.sort(function (a, b) { return b.count - a.count; });

    return s;
  }

  /* ---------- 开发调试用（发布时可移除） ---------- */
  /** 填充示例数据：覆盖各状态，方便快速检查页面效果 */
  function addSampleData() {
    var base = now();
    var samples = [
      { // 冷静中（1.5天前添加，2天冷静期：总价299→基础1.5天 + 单次16.6→+0.5天 + 欲望35→不动 = 2天，还剩约半天）
        name: '碎花连衣裙', price: 299, category: '服饰',
        duration: '3个月左右', frequency: '每周1–2次', desire: 35, scenario: '暂时没有明确场景',
        coolingHours: 48, status: 'cooling', startOffsetDays: 1.5,
        answers: [
          ['你预计会用多久？', '3个月左右'],
          ['你大概多久使用一次？', '每周1–2次'],
          ['你现在有多想买它？', '35%'],
          ['你准备在什么情况下使用它？', '暂时没有明确场景'],
        ],
      },
      { // 冷静期已结束（3.5天前添加，2天冷静期，已到期可体验决策）
        name: '无线蓝牙耳机', price: 899, category: '数码',
        duration: '1年左右', frequency: '每周3–6次', desire: 90, scenario: '日常使用',
        coolingHours: 48, status: 'cooling', startOffsetDays: 3.5,
        answers: [
          ['你预计会用多久？', '1年左右'],
          ['你大概多久使用一次？', '每周3–6次'],
          ['你现在有多想买它？', '90%'],
          ['你准备在什么情况下使用它？', '日常使用'],
        ],
      },
      { // 已购买（6天前添加，2天冷静期，5天前决定购买）
        name: '木质调淡香水', price: 399, category: '美妆',
        duration: '6个月左右', frequency: '每月几次', desire: 75, scenario: '日常使用',
        coolingHours: 48, status: 'bought', startOffsetDays: 6, decidedOffsetDays: 5,
        answers: [
          ['你预计会用多久？', '6个月左右'],
          ['你大概多久使用一次？', '每月几次'],
          ['你现在有多想买它？', '75%'],
          ['你准备在什么情况下使用它？', '日常使用'],
        ],
      },
      { // 已放弃（20天前添加，3天冷静期，6天前决定放弃）
        name: '便携胶囊咖啡机', price: 1299, category: '家居',
        duration: '1年左右', frequency: '偶尔使用', desire: 85, scenario: '暂时没有明确场景',
        coolingHours: 72, status: 'abandoned', startOffsetDays: 20, decidedOffsetDays: 6,
        answers: [
          ['你预计会用多久？', '1年左右'],
          ['你大概多久使用一次？', '偶尔使用'],
          ['你现在有多想买它？', '85%'],
          ['你准备在什么情况下使用它？', '暂时没有明确场景'],
        ],
      },
    ];

    samples.forEach(function (sp) {
      var times = CONFIG.expectedUsageFor(sp.duration, sp.frequency);
      var cost = CONFIG.calcCostPerUse(sp.price, times);
      var start = base - sp.startOffsetDays * DAY;
      var p = {
        name: sp.name,
        price: sp.price,
        image: null,
        category: sp.category,
        source: 'demo',
        createdAt: new Date(start).toISOString(),
        expectedUsage: times,
        costPerUse: cost,
        desire: sp.desire,
        scenario: sp.scenario,
        coolingPeriodHours: sp.coolingHours,
        coolingStartedAt: new Date(start).toISOString(),
        coolingEndAt: new Date(start + sp.coolingHours * HOUR).toISOString(),
        status: sp.status,
        hesitationCount: 0,
        answers: sp.answers.map(function (qa) { return { q: qa[0], a: qa[1] }; }),
        history: [{ at: new Date(start).toISOString(), text: '开始冷静' }],
      };
      if (sp.status === 'bought' || sp.status === 'abandoned') {
        p.decidedAt = new Date(base - sp.decidedOffsetDays * DAY).toISOString();
        p.decidedAction = sp.status;
        p.history.push({
          at: p.decidedAt,
          text: sp.status === 'bought' ? '冷静结束，决定购买' : '冷静结束，决定放弃',
        });
      }
      addProduct(p);
    });
  }

  /** 让所有仍在冷静中的商品立即结束冷静期（便于体验决策流程） */
  function endAllCooling() {
    load().products.forEach(function (p) {
      if (isInCooling(p) && !remaining(p).over) {
        p.coolingEndAt = new Date(now() - 1000).toISOString();
      }
    });
    save();
  }

  return {
    load: load, // 初始化时调用一次，从 localStorage 读入数据
    getUser: getUser,
    updateUser: updateUser,
    getProducts: getProducts,
    getProduct: getProduct,
    addProduct: addProduct,
    updateProduct: updateProduct,
    clearAll: clearAll,
    remaining: remaining,
    isInCooling: isInCooling,
    isCoolingOver: isCoolingOver,
    coolingDaysElapsed: coolingDaysElapsed,
    decide: decide,
    computeStats: computeStats,
    addSampleData: addSampleData,
    endAllCooling: endAllCooling,
  };
})();
