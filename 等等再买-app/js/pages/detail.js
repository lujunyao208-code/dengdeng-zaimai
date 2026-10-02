/**
 * ============================================================
 * 商品详情页 —— 「原来我当时这么想买」的决策档案
 *
 * 包含：商品信息 / 冷静进度 / 冷静期结束后的三个决定 /
 *       当时的决定过程 / 当时的回答 / 再冷静记录
 * ============================================================
 */
window.Pages = window.Pages || {};

Pages.detail = (function () {

  function render(root, id) {
    root.innerHTML = '<div class="page"></div>';
    var page = root.firstChild;

    var p = Store.getProduct(id);
    if (!p) {
      page.innerHTML =
        '<div class="empty"><div class="empty-ico">' + Icons.leaf + '</div>' +
        '<p class="empty-text">这件商品不见了…</p>' +
        '<button class="btn btn-main" data-back>返回我的物品</button></div>';
      page.querySelector('[data-back]').addEventListener('click', function () {
        location.hash = '#/items';
      });
      return;
    }

    var html = headHTML() + heroHTML(p);

    if (Store.isInCooling(p)) {
      html += Store.isCoolingOver(p) ? decideHTML(p) : coolingHTML(p);
    } else {
      html += finalHTML(p);
    }

    html += processHTML(p) + answersHTML(p) + historyHTML(p);

    page.innerHTML = html;
    bind(page, p);
  }

  function headHTML() {
    return (
      '<div class="detail-head">' +
        '<button class="back-btn" data-act="back">‹</button>' +
        '<span class="dh-title">商品详情</span>' +
      '</div>'
    );
  }

  function heroHTML(p) {
    var thumb = p.image
      ? '<img src="' + p.image + '" alt="' + UI.esc(p.name) + '">'
      : '<span class="ico">' + Icons.get(CONFIG.categoryIcon(p.category)) + '</span>';
    var sourceText = p.source === 'manual' ? '手动输入' : (p.source === 'demo' ? '示例数据' : '截图上传');
    var st = CONFIG.STATUS[p.status];
    return (
      '<div class="paper detail-hero">' +
        '<div class="dh-thumb">' + thumb + '</div>' +
        '<div>' +
          '<div class="dh-name">' + UI.esc(p.name) + '</div>' +
          '<div class="dh-price">' + UI.approxPrice(p.price) + '</div>' +
          '<div class="dh-tags">' +
            '<span class="tag-soft"><span class="ico">' + Icons.get(CONFIG.categoryIcon(p.category)) + '</span>' + UI.esc(p.category) + '</span>' +
            '<span class="tag-soft"><span class="ico">' + Icons.get(st.icon) + '</span>' + st.label + '</span>' +
            '<span class="tag-soft">' + sourceText + '</span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /** 冷静中：倒计时 */
  function coolingHTML(p) {
    var rem = Store.remaining(p);
    var coolingLabel = CONFIG.hoursLabel(p.coolingPeriodHours);
    var icon = p.status === 'hesitating' ? Icons.repeat : Icons.clock;
    var label = p.status === 'hesitating' ? '再冷静中' : '冷静中';
    return (
      '<div class="paper cool-progress">' +
        '<p class="cp-label"><span class="ico">' + icon + '</span>' + label + ' · 冷静期 ' + coolingLabel + '</p>' +
        '<p class="cp-time">' + UI.remainingText(rem) + '</p>' +
        '<p class="cp-end">' + UI.dateTimeCN(p.coolingEndAt) + ' 之后再来决定</p>' +
      '</div>'
    );
  }

  /** 冷静期结束：三个选择 */
  function decideHTML(p) {
    var days = UI.daysSince(p.coolingStartedAt || p.createdAt);
    var btns = CONFIG.DECISIONS.map(function (d) {
      return (
        '<button class="decide-btn" data-decide="' + d.action + '">' +
          '<span class="db-emoji ico">' + Icons.get(d.icon) + '</span>' +
          '<span class="db-body">' +
            '<span class="db-label">' + d.label + '</span><br>' +
            '<span class="db-note">' + d.note + '</span>' +
          '</span>' +
        '</button>'
      );
    }).join('');
    return (
      '<div class="paper decide-card">' +
        '<p class="dc-ding"><span class="ico">' + Icons.bell + '</span>叮～</p>' +
        '<p class="dc-text">你<b>' + days + '天前</b>想买的「' + UI.esc(p.name) + '」，<br>今天还想要吗？</p>' +
        btns +
      '</div>'
    );
  }

  /** 已决定：最终结果 */
  function finalHTML(p) {
    var isBought = p.status === 'bought';
    return (
      '<div class="paper final-result">' +
        '<div class="fr-emoji ico" style="color:' + (isBought ? 'var(--accent-deep)' : 'var(--green-deep)') + '">' + (isBought ? Icons.bag : Icons.leaf) + '</div>' +
        '<div class="fr-title" style="color:' + (isBought ? 'var(--accent-deep)' : 'var(--green-deep)') + '">' +
          (isBought ? '已购买' : '已放弃') + '</div>' +
        '<div class="fr-date">' + UI.dateCN(p.decidedAt) + ' 做的决定</div>' +
        (isBought
          ? '<div class="fr-save">喜欢的东西，拥有它也是一种认真 ♡</div>'
          : '<div class="fr-save">为自己省下 ' + UI.approxPrice(p.price) + '</div>') +
      '</div>'
    );
  }

  /** 当时的决定过程（只记录回答与结论，不展示算法细节；金额一律用约数） */
  function processHTML(p) {
    var ans = p.answers || [];
    var rows = [
      ['添加时间', UI.dateTimeCN(p.createdAt)],
      ['商品价格', UI.approxPrice(p.price)],
      ['预计使用时间', ans.length > 0 ? ans[0].a : '—'],
      ['使用频率', ans.length > 1 ? ans[1].a : '—'],
      ['购买欲望', ans.length > 2 ? ans[2].a : '—'],
      ['使用场景', ans.length > 3 ? ans[3].a : '—'],
      ['单次使用成本', UI.approxCost(p.costPerUse)],
      ['冷静期时长', CONFIG.hoursLabel(p.coolingPeriodHours)],
    ];
    if (p.decidedAt) rows.push(['决定时间', UI.dateTimeCN(p.decidedAt)]);
    return (
      '<div class="paper" style="margin-bottom:14px;">' +
        '<div class="card-title"><span class="ico">' + Icons.receipt + '</span>当时的决定过程</div>' +
        '<div class="kv-list">' + rows.map(function (r) {
          return '<div class="kv-row"><span class="k">' + r[0] + '</span><span class="v">' + r[1] + '</span></div>';
        }).join('') + '</div>' +
      '</div>'
    );
  }

  /** 当时的回答 */
  function answersHTML(p) {
    if (!p.answers || !p.answers.length) return '';
    return (
      '<div class="paper" style="margin-bottom:14px;">' +
        '<div class="card-title"><span class="ico">' + Icons.chat + '</span>当时的回答</div>' +
        p.answers.map(function (qa) {
          return (
            '<div class="qa-row">' +
              '<div class="qa-q">' + UI.esc(qa.q) + '</div>' +
              '<div class="qa-a">' + UI.esc(qa.a) + '</div>' +
            '</div>'
          );
        }).join('') +
      '</div>'
    );
  }

  /** 再冷静记录 */
  function historyHTML(p) {
    var list = p.history || [];
    if (list.length <= 1) return '';
    return (
      '<div class="paper">' +
        '<div class="card-title"><span class="ico">' + Icons.repeat + '</span>纠结的记录</div>' +
        list.slice(1).map(function (h) {
          return '<div class="hist-row"><span>' + UI.esc(h.text) + '</span><span>' + UI.dateTimeCN(h.at) + '</span></div>';
        }).join('') +
      '</div>'
    );
  }

  function bind(page, p) {
    page.addEventListener('click', function (e) {
      if (e.target.closest('[data-act="back"]')) {
        location.hash = '#/items';
        return;
      }
      var btn = e.target.closest('.decide-btn');
      if (!btn) return;
      var action = btn.getAttribute('data-decide');

      if (action === 'bought') {
        Store.decide(p, 'bought');
        UI.toast('好呀，喜欢的东西值得拥有');
      } else if (action === 'abandoned') {
        Store.decide(p, 'abandoned');
        UI.toast('为自己省下 ' + UI.approxPrice(p.price));
      } else {
        Store.decide(p, 'hesitate');
        UI.toast('好的，我们再冷静一次');
      }
      render(document.getElementById('app'), p.id); // 决定后立即刷新详情页
    });
  }

  return { render: render };
})();
