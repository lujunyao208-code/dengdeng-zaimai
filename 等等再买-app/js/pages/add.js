/**
 * ============================================================
 * 界面二：添加新物品 —— 整个产品的核心页面
 *
 * V2.0 变更：
 *   - 截图识别通过 Cloudflare Worker 中转调用 Gemini Vision API
 *   - 用户无需配置任何 API Key，打开即用
 *   - 上传时同时生成高清版（800px）用于 OCR，存储仍用压缩版
 *   - 识别失败时优雅降级：允许手动输入
 *
 * 流程：上传截图（或手动输入）→ 商品识别（AI 视觉，类别+价格）
 *       → 确认/修改商品信息 → 一次一个问题（4 问：
 *       使用时间 / 使用频率 / 购买欲望滑块 / 使用场景）
 *       → 综合判断（总价 + 单次成本 + 欲望 + 场景）→ 结果页只给结论 → 开始冷静
 * ============================================================
 */
window.Pages = window.Pages || {};
Pages.add = (function () {
  /** 页面状态机 */
  var state = null;
  function fresh() {
    return {
      step: 'pick',          // pick | recognizing | confirm | questions | calc | result
      image: null,           // 上传的商品截图 dataURL（压缩版，用于存储）
      imageHD: null,         // 高清版 dataURL（用于 OCR 识别）
      draft: null,           // 商品信息 { name, price, category }（识别结果，可编辑）
      manualOpen: false,     // 手动输入表单是否展开
      qIndex: 0,
      answers: [],           // [{ q, a }]
      recognizeError: null,  // 识别错误信息
    };
  }
  function ensure() { if (!state) state = fresh(); return state; }

  /**
   * 生成高清版图片用于 OCR
   * 原版 480px 对价格文字识别可能不够清晰，OCR 专用 800px 版本
   */
  function createHDVersion(dataUrl) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var maxSide = 800;
        var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale);
        var h = Math.round(img.height * scale);
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;
    });
  }

  /* ============================================================
   * 渲染
   * ========================================================== */
  function render(app) {
    var s = ensure();
    app.innerHTML = '<div class="page"></div>';
    var page = app.firstChild;
    if (s.step === 'pick') renderPick(page, s, app);
    else if (s.step === 'recognizing') renderRecognizing(page, s);
    else if (s.step === 'confirm') renderConfirm(page, s, app);
    else if (s.step === 'questions') renderQuestions(page, s, app);
    else if (s.step === 'calc') renderCalc(page, s);
    else if (s.step === 'result') renderResult(page, s, app);
  }
  /** 页面顶部：纸张区文案 */
  function headHTML() {
    return (
      '<header class="add-head">' +
        '<p class="h-hand">你今天又被种草了吗？</p>' +
        '<p class="h-sub">上传一个想买的东西，让我们一起冷静一下吧～</p>' +
      '</header>'
    );
  }

  /* ---------- Step 1: 未上传 ---------- */
  function renderPick(page, s, app) {
    page.innerHTML =
      headHTML() +
      '<div class="upload-box" data-act="upload">' +
        '<span class="up-icon ico">' + Icons.camera + '</span>' +
        '<span class="up-main">上传截图</span>' +
        '<span class="up-sub">支持淘宝 / 小红书 / 京东等平台截图<br>AI 自动识别商品类型和价格</span>' +
      '</div>' +
      '<div class="or-line">或者</div>' +
      '<div class="manual-toggle"><button data-act="toggle-manual"><span class="ico">' + Icons.pencil + '</span>手动输入商品</button></div>' +
      (s.manualOpen ? manualFormHTML(s) : '') +
      (s.recognizeError ? '<div class="paper" style="margin-top:12px;background:#fff3f0;border:1px solid #ffccc7;"><p style="font-size:13px;color:#d32f2f;line-height:1.6;margin:0;">' + UI.esc(s.recognizeError) + '</p></div>' : '') +
      '<input type="file" id="file-input" accept="image/*" hidden>';

    var input = page.querySelector('#file-input');
    page.querySelector('[data-act="upload"]').addEventListener('click', function () {
      input.value = '';
      input.click();
    });
    input.addEventListener('change', function () {
      if (!input.files || !input.files[0]) return;
      UI.readImageFile(input.files[0]).then(function (dataUrl) {
        s.image = dataUrl;
        s.recognizeError = null;
        // 生成高清版用于 OCR
        return createHDVersion(dataUrl).then(function (hdUrl) {
          s.imageHD = hdUrl;
          s.step = 'recognizing';
          render(app);
          return OCRService.recognize(hdUrl);
        });
      }).then(function (result) {
        if (!result) return;
        s.draft = {
          name: result.name,
          price: result.price,
          category: result.category,
          confidence: result.confidence,
          priceNote: result.priceNote,
        };
        s.step = 'confirm';
        if (window.App && App.currentPage() === 'add') render(app);
      }).catch(function (err) {
        // 识别失败时回到上传页，显示错误信息，允许手动输入
        s.recognizeError = '识别遇到问题：' + (err.message || '未知错误') + '。你可以重新上传或手动输入商品。';
        s.step = 'pick';
        s.manualOpen = true; // 自动展开手动输入
        if (window.App && App.currentPage() === 'add') render(app);
      });
    });
    page.querySelector('[data-act="toggle-manual"]').addEventListener('click', function () {
      s.manualOpen = !s.manualOpen;
      render(app);
    });
    bindManualForm(page, s, app);
  }

  function manualFormHTML(s) {
    var catChips = CONFIG.CATEGORIES.map(function (c) {
      var sel = s.draft && s.draft.category === c.key;
      return '<button class="cat-chip' + (sel ? ' selected' : '') + '" data-cat="' + c.key + '"><span class="ico">' + Icons.get(c.icon) + '</span>' + c.key + '</button>';
    }).join('');
    return (
      '<div class="paper" data-form="manual" style="margin-top:4px;">' +
        '<div class="card-title"><span class="ico">' + Icons.pencil + '</span>手动输入</div>' +
        '<div class="field"><label>商品名称</label><input type="text" id="m-name" maxlength="30" placeholder="比如：碎花连衣裙" value="' + UI.esc(s.draft ? s.draft.name || '' : '') + '"></div>' +
        '<div class="field"><label>商品价格</label>' +
          '<div class="input-unit"><input type="number" id="m-price" inputmode="decimal" min="0.01" step="0.01" placeholder="0.00" value="' + (s.draft ? s.draft.price || '' : '') + '"><span class="unit">¥</span></div>' +
        '</div>' +
        '<div class="field"><label>商品类别</label><div class="cat-chips">' + catChips + '</div></div>' +
        '<button class="btn btn-main btn-block" data-act="manual-submit">填好啦，开始聊聊 →</button>' +
      '</div>'
    );
  }
  function bindManualForm(page, s, app) {
    var form = page.querySelector('[data-form="manual"]');
    if (!form) return;
    form.addEventListener('click', function (e) {
      var chip = e.target.closest('.cat-chip');
      if (!chip) return;
      s.draft = s.draft || {};
      s.draft.category = chip.getAttribute('data-cat');
      form.querySelectorAll('.cat-chip').forEach(function (el) {
        el.classList.toggle('selected', el === chip);
      });
    });
    form.querySelector('[data-act="manual-submit"]').addEventListener('click', function () {
      var name = (form.querySelector('#m-name').value || '').trim();
      var price = parseFloat(form.querySelector('#m-price').value);
      if (!name) { UI.toast('给商品起个名字吧～'); return; }
      if (!price || price <= 0) { UI.toast('填一下价格哦～'); return; }
      s.draft = { name: name, price: price, category: s.draft && s.draft.category ? s.draft.category : '其他' };
      startQuestions(app, s);
    });
  }

  /* ---------- Step 2: 识别中 ---------- */
  function renderRecognizing(page, s) {
    page.innerHTML =
      headHTML() +
      '<div class="recognizing">' +
        '<div class="rec-img"><img src="' + s.image + '" alt="商品截图"></div>' +
        '<p class="rec-text">AI 正在分析截图内容…</p>' +
        '<div class="rec-dots"><span></span><span></span><span></span></div>' +
      '</div>';
  }

  /* ---------- Step 3: 确认识别结果 ---------- */
  function renderConfirm(page, s, app) {
    var d = s.draft || {};
    var catChips = CONFIG.CATEGORIES.map(function (c) {
      var sel = d.category === c.key;
      return '<button class="cat-chip' + (sel ? ' selected' : '') + '" data-cat="' + c.key + '"><span class="ico">' + Icons.get(c.icon) + '</span>' + c.key + '</button>';
    }).join('');
    var priceValue = d.price != null ? d.price : '';
    var pricePlaceholder = d.price == null ? '请填写价格' : '';
    page.innerHTML =
      headHTML() +
      '<div class="paper">' +
        '<div class="rec-result-card">' +
          '<div class="rr-thumb"><img src="' + s.image + '" alt="商品截图"></div>' +
          '<div class="rr-body">' +
            '<div class="rr-name">' + UI.esc(d.name || '') + '</div>' +
            '<div class="rr-meta">AI 识别结果 · 置信度 ' + (d.confidence || 90) + '%<br>仅供参考，可以改一改～</div>' +
          '</div>' +
        '</div>' +
        '<div class="field"><label>商品名称</label><input type="text" id="c-name" maxlength="30" value="' + UI.esc(d.name || '') + '"></div>' +
        '<div class="field"><label>商品价格</label>' +
          '<div class="input-unit"><input type="number" id="c-price" inputmode="decimal" min="0.01" step="0.01" placeholder="' + pricePlaceholder + '" value="' + priceValue + '"><span class="unit">¥</span></div>' +
          '<p class="price-note">' + UI.esc(d.priceNote || '已核对图片内数字，取实际售价') +
            (d.price ? '<br>展示时会显示为 ' + UI.approxPrice(d.price) + '；' : '<br>') +
            '价格和类别都可以直接修改，改完结果会自动重算～</p>' +
        '</div>' +
        '<div class="field"><label>商品类别</label><div class="cat-chips">' + catChips + '</div></div>' +
        '<button class="btn btn-main btn-block" data-act="confirm-ok">就是它啦，开始聊聊 →</button>' +
        '<button class="btn btn-ghost btn-block" style="margin-top:10px;" data-act="re-upload"><span class="ico">' + Icons.refresh + '</span>重新上传</button>' +
      '</div>';
    page.addEventListener('click', function (e) {
      var chip = e.target.closest('.cat-chip');
      if (chip) {
        s.draft.category = chip.getAttribute('data-cat');
        page.querySelectorAll('.cat-chip').forEach(function (el) {
          el.classList.toggle('selected', el === chip);
        });
        return;
      }
      if (e.target.closest('[data-act="confirm-ok"]')) {
        var name = (page.querySelector('#c-name').value || '').trim();
        var price = parseFloat(page.querySelector('#c-price').value);
        if (!name) { UI.toast('给商品起个名字吧～'); return; }
        if (!price || price <= 0) { UI.toast('填一下价格哦～'); return; }
        s.draft.name = name;
        s.draft.price = price;
        startQuestions(app, s);
        return;
      }
      if (e.target.closest('[data-act="re-upload"]')) {
        state = fresh();
        render(app);
      }
    });
  }

  /* ---------- Step 4: 一次一个问题 ---------- */
  function renderQuestions(page, s, app) {
    var dots = CONFIG.QUESTIONS.map(function (q, i) {
      var cls = i < s.qIndex ? 'done' : (i === s.qIndex ? 'cur' : '');
      return '<span class="q-dot ' + cls + '"></span>';
    }).join('');
    page.innerHTML =
      headHTML() +
      '<div class="q-progress">' + dots + '</div>' +
      '<div class="paper q-card q-in" id="q-card">' + questionHTML(s) + '</div>';
    var q = CONFIG.QUESTIONS[s.qIndex];
    if (q.type === 'slider') {
      var range = page.querySelector('#desire-range');
      var val = page.querySelector('#desire-val');
      var fillRange = function () {
        var pct = ((range.value - range.min) / (range.max - range.min)) * 100;
        range.style.background = 'linear-gradient(to right, var(--accent-deep) ' + pct + '%, var(--accent-soft) ' + pct + '%)';
      };
      range.addEventListener('input', function () {
        val.textContent = range.value + '%';
        fillRange();
      });
      fillRange();
      page.querySelector('[data-act="slider-ok"]').addEventListener('click', function () {
        s.answers.push({ q: q.title, a: range.value + '%' });
        advance(page, app, s);
      });
    } else {
      page.addEventListener('click', function (e) {
        var opt = e.target.closest('.opt');
        if (!opt || opt.classList.contains('disabled')) return;
        var answer = opt.getAttribute('data-answer');
        page.querySelectorAll('.opt').forEach(function (el) {
          el.classList.add('disabled');
          if (el === opt) el.classList.add('selected');
        });
        s.answers.push({ q: q.title, a: answer });
        setTimeout(function () { advance(page, app, s); }, 420);
      });
    }
  }
  function questionHTML(s) {
    var q = CONFIG.QUESTIONS[s.qIndex];
    if (q.type === 'slider') {
      var dflt = q.default != null ? q.default : CONFIG.DESIRE_DEFAULT;
      return (
        '<p class="q-intro">' + q.intro + '</p>' +
        '<p class="q-title">' + q.title + '</p>' +
        '<div class="q-slider">' +
          '<p class="qs-val" id="desire-val">' + dflt + '%</p>' +
          '<input type="range" id="desire-range" min="0" max="100" value="' + dflt + '" aria-label="购买欲望">' +
          '<div class="qs-scale"><span>没那么想买</span><span>超级想买</span></div>' +
          '<button class="btn btn-main btn-block" data-act="slider-ok">确定</button>' +
        '</div>'
      );
    }
    var opts = (q.options || []).map(function (opt, i) {
      var note = q.notes && q.notes[i] ? '<span class="opt-note">' + UI.esc(q.notes[i]) + '</span>' : '';
      return (
        '<button class="opt" data-answer="' + UI.esc(opt) + '">' +
          '<span>' + opt + note + '</span>' +
          '<span class="opt-check">✓</span>' +
        '</button>'
      );
    }).join('');
    return (
      '<p class="q-intro">' + q.intro + '</p>' +
      '<p class="q-title">' + q.title + '</p>' +
      '<div class="q-options">' + opts + '</div>'
    );
  }

  /* ---------- Step 5: 计算中 ---------- */
  function renderCalc(page, s) {
    page.innerHTML =
      headHTML() +
      '<div class="calc-loading">' +
        '<span class="cl-emoji ico">' + Icons.calculator + '</span>' +
        '<p class="cl-text">让我算算～</p>' +
        '<div class="rec-dots"><span></span><span></span><span></span></div>' +
      '</div>';
  }

  /* ---------- Step 6: 结果 ---------- */
  function renderResult(page, s, app) {
    var d = s.draft;
    var times = CONFIG.expectedUsageFor(
      s.answers.length ? s.answers[0].a : '',
      s.answers.length > 1 ? s.answers[1].a : ''
    );
    d.expectedUsage = times;
    var cost = CONFIG.calcCostPerUse(d.price, times);
    var desire = parseInt(s.answers.length > 2 ? s.answers[2].a : '', 10);
    if (isNaN(desire)) desire = CONFIG.DESIRE_DEFAULT;
    var scenario = s.answers.length > 3 ? s.answers[3].a : '暂时没有明确场景';
    var days = CONFIG.computeCoolingDays(d.price, cost, desire, scenario);
    days = CONFIG.adjustCoolingDays(days, Store.getUser().coolingMode);
    var hours = days * 24;
    var verdict = CONFIG.verdictFor(d.price, cost, desire, scenario);
    page.innerHTML =
      headHTML() +
      '<div class="paper result-card">' +
        '<p class="rc-verdict">' + verdict.title + '</p>' +
        '<p class="rc-days">冷静 <b>' + days + '</b> 天</p>' +
        '<p class="rc-sentence">' + (days === 0 ? '这次不用等，随时可以决定。' : CN_DAYS[days] + '天后，再决定要不要买。') + '</p>' +
        '<button class="btn btn-main btn-block" data-act="start-cooling">' + (days === 0 ? '记下来，随时可以决定 →' : '开始冷静 →') + '</button>' +
        '<p class="rc-note">' + (days === 0 ? '这次用起来挺值得，不需要冷静期' : '冷静期结束前，不急着做决定哦') + '</p>' +
      '</div>';
    page.querySelector('[data-act="start-cooling"]').addEventListener('click', function () {
      var t = new Date().toISOString();
      var product = {
        name: d.name,
        price: d.price,
        image: s.image,
        category: d.category,
        source: s.image ? 'image' : 'manual',
        createdAt: t,
        expectedUsage: times,
        costPerUse: cost,
        desire: desire,
        scenario: scenario,
        coolingPeriodHours: hours,
        coolingStartedAt: t,
        coolingEndAt: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
        status: 'cooling',
        hesitationCount: 0,
        answers: s.answers,
        history: [{ at: t, text: '开始冷静' }],
      };
      Store.addProduct(product);
      state = fresh();
      UI.toast(days === 0 ? '记下啦，随时可以决定' : '已加入冷静清单，先等等它');
      location.hash = '#/items';
    });
  }
  var CN_DAYS = ['零', '一', '两', '三', '四', '五'];

  /* ---------- 流程推进 ---------- */
  function startQuestions(app, s) {
    s.qIndex = 0;
    s.answers = [];
    s.step = 'questions';
    render(app);
  }
  function advance(page, app, s) {
    var card = page.querySelector('#q-card');
    if (card) { card.classList.remove('q-in'); card.classList.add('q-out'); }
    setTimeout(function () {
      var onPage = !window.App || App.currentPage() === 'add';
      if (s.qIndex < CONFIG.QUESTIONS.length - 1) {
        s.qIndex++;
        if (onPage) render(app);
      } else {
        s.step = 'calc';
        if (onPage) render(app);
        setTimeout(function () {
          s.step = 'result';
          if (!window.App || App.currentPage() === 'add') render(app);
        }, 1100);
      }
    }, 240);
  }
  return { render: render };
})();
