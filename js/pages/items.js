/**
 * ============================================================
 * 界面一：我的物品 —— 「我曾经想买过什么？」的记录库
 * 筛选：全部 ｜ 冷静中 ｜ 已购买 ｜ 已放弃
 * （继续犹豫的商品正在再冷静，归入「冷静中」筛选）
 * ============================================================
 */
window.Pages = window.Pages || {};

Pages.items = (function () {

  var filter = 'all'; // all | cooling | bought | abandoned

  var FILTERS = [
    { key: 'all',       label: '全部' },
    { key: 'cooling',   label: '冷静中' },
    { key: 'bought',    label: '已购买' },
    { key: 'abandoned', label: '已放弃' },
  ];

  function matched(p) {
    if (filter === 'all') return true;
    if (filter === 'cooling') return Store.isInCooling(p);
    return p.status === filter;
  }

  function counts(products) {
    return {
      all: products.length,
      cooling: products.filter(function (p) { return Store.isInCooling(p); }).length,
      bought: products.filter(function (p) { return p.status === 'bought'; }).length,
      abandoned: products.filter(function (p) { return p.status === 'abandoned'; }).length,
    };
  }

  function badgeHTML(p) {
    if (Store.isInCooling(p)) {
      if (Store.isCoolingOver(p)) {
        return '<span class="pc-badge badge-over"><span class="ico">' + Icons.bell + '</span><span>冷静结束 · 可以决定啦</span></span>';
      }
      var cls = p.status === 'hesitating' ? 'badge-hesitate' : 'badge-cooling';
      var prefix = p.status === 'hesitating' ? '再冷静中 · ' : '冷静中 · ';
      var icon = p.status === 'hesitating' ? Icons.repeat : Icons.clock;
      return '<span class="pc-badge ' + cls + '"><span class="ico">' + icon + '</span><span>' + prefix + UI.remainingText(Store.remaining(p)) + '</span></span>';
    }
    if (p.status === 'bought') {
      return '<span class="pc-badge badge-bought"><span class="ico">' + Icons.check + '</span><span>已购买 · ' + UI.dateCN(p.decidedAt) + '</span></span>';
    }
    return '<span class="pc-badge badge-abandoned"><span class="ico">' + Icons.leaf + '</span><span>已放弃 · ' + UI.dateCN(p.decidedAt) + '</span></span>';
  }

  function cardHTML(p, index) {
    var thumb = p.image
      ? '<img src="' + p.image + '" alt="' + UI.esc(p.name) + '">'
      : '<span class="ico">' + Icons.get(CONFIG.categoryIcon(p.category)) + '</span>';
    return (
      '<article class="product-card" data-id="' + p.id + '" style="animation-delay:' + Math.min(index * 60, 360) + 'ms">' +
        '<div class="pc-thumb">' + thumb + '</div>' +
        '<div class="pc-body">' +
          '<div class="pc-name">' + UI.esc(p.name) + '</div>' +
          '<div class="pc-meta">' +
            '<span class="cat-tag"><span class="ico">' + Icons.get(CONFIG.categoryIcon(p.category)) + '</span>' + UI.esc(p.category) + '</span>' +
            '<span class="pc-price">' + UI.approxPrice(p.price) + '</span>' +
          '</div>' +
          badgeHTML(p) +
        '</div>' +
        '<span class="pc-arrow">›</span>' +
      '</article>'
    );
  }

  function render(root) {
    var products = Store.getProducts();
    var c = counts(products);
    var overList = products.filter(Store.isCoolingOver);
    var list = products.filter(matched);

    var html =
      '<header style="padding:4px 2px 0;">' +
        '<h1 class="h-title">' + CONFIG.APP_NAME + '</h1>' +
        '<p class="h-sub">' + CONFIG.TAGLINE + '</p>' +
      '</header>';

    // 冷静期结束提醒（MVP 无推送，用横幅承担「叮～」提醒）
    if (overList.length > 0) {
      var first = overList[0];
      html +=
        '<div class="notice-banner" data-id="' + first.id + '">' +
          '<span class="nb-icon ico">' + Icons.bell + '</span>' +
          '<span class="nb-text"><b>叮～</b> 你' + UI.daysSince(first.coolingStartedAt || first.createdAt) + '天前想买的「' + UI.esc(first.name) + '」，今天还想要吗？' +
            (overList.length > 1 ? '（还有' + (overList.length - 1) + '件也到期了）' : '') +
          '</span>' +
          '<span class="nb-arrow">›</span>' +
        '</div>';
    }

    // 筛选标签
    html += '<div class="chips" role="tablist">';
    FILTERS.forEach(function (f) {
      html +=
        '<button class="chip' + (filter === f.key ? ' active' : '') + '" data-filter="' + f.key + '">' +
          f.label + '<span class="chip-count">' + c[f.key] + '</span>' +
        '</button>';
    });
    html += '</div>';

    // 商品列表
    if (list.length === 0) {
      html += emptyHTML();
    } else {
      html += '<div class="list">' + list.map(cardHTML).join('') + '</div>';
    }

    // 每次渲染都重建页面容器，事件绑定在容器上，避免重复累积
    root.innerHTML = '<div class="page">' + html + '</div>';
    bind(root.firstChild);
  }

  function emptyHTML() {
    if (filter === 'all') {
      return (
        '<div class="empty">' +
          '<div class="empty-ico">' + Icons.bear + '</div>' +
          '<p class="empty-text">这里还没有记录想买的东西<br>把心动的东西先放在这里吧～</p>' +
          '<button class="btn btn-main" data-go-add><span class="ico">' + Icons.plus + '</span>添加新物品</button>' +
        '</div>'
      );
    }
    return (
      '<div class="empty">' +
        '<div class="empty-ico">' + Icons.leaf + '</div>' +
        '<p class="empty-text">这里还空空的～</p>' +
      '</div>'
    );
  }

  function bind(page) {
    page.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (chip) {
        filter = chip.getAttribute('data-filter');
        render(document.getElementById('app'));
        return;
      }
      var card = e.target.closest('.product-card, .notice-banner');
      if (card) {
        location.hash = '#/detail/' + card.getAttribute('data-id');
        return;
      }
      if (e.target.closest('[data-go-add]')) {
        location.hash = '#/add';
      }
    });
  }

  return { render: render, reset: function () { filter = 'all'; } };
})();
