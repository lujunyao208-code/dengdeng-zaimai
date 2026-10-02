/**
 * ============================================================
 * 界面三：我的 —— 用户自己的消费档案
 *
 * 个人资料 + 消费数据（已花费 / 没花的钱 / 为自己省下）
 * + 冷静记录 + 消费偏好 + 设置
 * 所有数据由 Store.computeStats() 实时推导，随操作动态变化。
 *
 * 另含：关于页（含开发调试工具，发布时可移除）
 * ============================================================
 */
window.Pages = window.Pages || {};

Pages.profile = (function () {

  function render(root) {
    var user = Store.getUser();
    var s = Store.computeStats();
    root.innerHTML = '<div class="page"></div>';
    var page = root.firstChild;

    var html =
      '<header class="profile-head">' +
        '<span class="avatar" data-avatar="' + UI.esc(user.avatar) + '">' + avatarContent(user) + '</span>' +
        '<div class="ph-info">' +
          '<div class="ph-name">' + UI.esc(user.nickname) + '</div>' +
          '<div class="ph-tag">' + UI.esc(user.tagline || '今天也少买一点点') + '</div>' +
          '<button class="btn-mini ph-edit" data-act="edit"><span class="ico">' + Icons.pencil + '</span>编辑资料</button>' +
        '</div>' +
      '</header>' +

      // 两个核心数据卡片（没花的钱 = 已省下的钱，只保留一个；视觉与其他模块统一）
      '<div class="stats-grid">' +
        '<div class="paper stat-card sc-spent">' +
          '<div class="sc-label">已花费</div>' +
          '<div class="sc-value">' + UI.money(s.totalSpent) + '</div>' +
        '</div>' +
        '<div class="paper stat-card sc-saved">' +
          '<div class="sc-label">已省下的钱</div>' +
          '<div class="sc-value">' + UI.money(s.totalSaved) + '</div>' +
          '<div class="sc-sub">因为多想了一下，省下了一笔不必要的支出</div>' +
        '</div>' +
      '</div>' +

      // 冷静记录
      '<div class="paper" style="margin-bottom:14px;">' +
        '<div class="card-title"><span class="ico">' + Icons.clock + '</span>我的冷静记录</div>' +
        '<div class="record-grid">' +
          rgItem(s.cooledCount, '件', '已冷静商品') +
          rgItem(fmtDays(s.totalCoolingDays), '天', '累计冷静时间') +
          rgItem(fmtDays(s.avgCoolingDays), '天', '平均冷静时间') +
          rgItem(s.boughtCount, '件', '最终购买') +
          rgItem(s.abandonedCount, '件', '最终放弃') +
        '</div>' +
      '</div>' +

      // 消费偏好（简单版）
      prefHTML(s) +

      // 设置（V1.1：删除通知设置；冷静期偏好与账号与安全都做成可用页面）
      '<div class="paper" style="margin-bottom:14px;">' +
        '<div class="card-title"><span class="ico">' + Icons.gear + '</span>设置</div>' +
        setRow('hourglass', '冷静期偏好', 'cooling') +
        setRow('lock', '账号与安全', 'account') +
        setRow('info', '关于「' + CONFIG.APP_NAME + '」', 'about') +
      '</div>' +

      '<p class="app-footer">' + CONFIG.APP_NAME + ' v1.0 MVP<br>喜欢它没关系，先不用马上拥有它。</p>';

    page.innerHTML = html;
    bind(page, user);
  }

  function rgItem(value, unit, label) {
    return (
      '<div class="rg-item">' +
        '<div class="rg-value">' + value + '<small>' + unit + '</small></div>' +
        '<div class="rg-label">' + label + '</div>' +
      '</div>'
    );
  }

  /** 天数：整数不带小数，非整数保留 1 位 */
  function fmtDays(d) {
    var v = Number(d || 0);
    return Number.isInteger(v) ? v : v.toFixed(1);
  }

  function prefHTML(s) {
    var rows;
    if (!s.categoryList.length) {
      rows = '<p style="text-align:center;color:var(--ink-faint);font-size:13.5px;padding:10px 0;">还没有数据，先去添加一件商品吧～</p>';
    } else {
      rows = s.categoryList.map(function (c) {
        return (
          '<div class="pref-row">' +
            '<span class="pr-emoji ico">' + Icons.get(CONFIG.categoryIcon(c.category)) + '</span>' +
            '<span class="pr-name">' + UI.esc(c.category) + '</span>' +
            '<span class="pr-bar"><span class="pr-fill" style="width:' + c.pct + '%"></span></span>' +
            '<span class="pr-pct">' + c.pct + '%</span>' +
          '</div>'
        );
      }).join('');
    }
    return (
      '<div class="paper" style="margin-bottom:14px;">' +
        '<div class="card-title"><span class="ico">' + Icons.heart + '</span>我最常被什么种草</div>' +
        rows +
      '</div>'
    );
  }

  function setRow(icon, label, key) {
    return (
      '<button class="set-row" data-set="' + key + '">' +
        '<span class="sr-left"><span class="sr-ico ico">' + Icons.get(icon) + '</span><span>' + label + '</span></span>' +
        '<span class="sr-arrow">›</span>' +
      '</button>'
    );
  }

  function bind(page, user) {
    page.addEventListener('click', function (e) {
      // V1.2：头像上传入口统一放在「编辑资料」页面，点头像不再直接弹上传
      if (e.target.closest('[data-act="edit"]')) {
        location.hash = '#/settings/profile';
        return;
      }
      var row = e.target.closest('.set-row');
      if (!row) return;
      var key = row.getAttribute('data-set');
      if (key === 'about') location.hash = '#/about';
      else if (key === 'cooling') location.hash = '#/settings/cooling';
      else if (key === 'account') location.hash = '#/settings/account';
    });
  }

  /** 头像内容：自上传图片优先，否则默认线稿图标 */
  function avatarContent(user) {
    if (user.avatarImage) {
      return '<img src="' + user.avatarImage + '" alt="头像">';
    }
    return Icons.get(user.avatar);
  }

  /* 编辑资料改为独立页面（#/settings/profile），见 js/pages/settings.js */

  /* ============================================================
   * 关于页（含开发调试工具）
   * ========================================================== */
  Pages.about = {
    render: function (root) {
      root.innerHTML = '<div class="page"></div>';
      var page = root.firstChild;
      page.innerHTML =
        '<div class="detail-head">' +
          '<button class="back-btn" data-act="back">‹</button>' +
          '<span class="dh-title">关于「' + CONFIG.APP_NAME + '」</span>' +
        '</div>' +
        '<div class="about-logo">' +
          '<div class="al-emoji ico">' + Icons.flower + '</div>' +
          '<div class="al-name">' + CONFIG.APP_NAME + '</div>' +
          '<div class="al-tag">v1.0 MVP · 消费决策辅助工具</div>' +
        '</div>' +
        '<div class="paper" style="margin:16px 0 14px;">' +
          '<div class="card-title"><span class="ico">' + Icons.heart + '</span>我们想做什么</div>' +
          '<p class="about-text">「' + CONFIG.APP_NAME + '」不劝你少买东西，<br>而是在每一次<b>「好想买！」</b>的时候，<br>给你一个再想一想的机会。<br><br>' +
          '把心动的东西放进来，回答几个小问题，<br>看看它的<b>单次使用成本</b>，<br>然后给自己一段冷静期。<br><br>' +
          '喜欢它没关系，<b>先不用马上拥有它。</b></p>' +
        '</div>' +
        '<div class="paper">' +
          '<div class="card-title"><span class="ico">' + Icons.gear + '</span>开发工具（仅调试用）</div>' +
          '<button class="dev-btn" data-dev="sample"><span class="ico">' + Icons.sparkles + '</span>填充示例数据（覆盖各状态）</button>' +
          '<button class="dev-btn" data-dev="end-cooling"><span class="ico">' + Icons.forward + '</span>让所有冷静期立即结束</button>' +
          '<button class="dev-btn danger" data-dev="clear"><span class="ico">' + Icons.trash + '</span>清空全部数据</button>' +
        '</div>';
      page.addEventListener('click', function (e) {
        if (e.target.closest('[data-act="back"]')) {
          location.hash = '#/profile';
          return;
        }
        var btn = e.target.closest('.dev-btn');
        if (!btn) return;
        var action = btn.getAttribute('data-dev');
        if (action === 'sample') {
          Store.addSampleData();
          UI.toast('已填充示例数据，去看看我的物品吧');
          setTimeout(function () { location.hash = '#/items'; }, 900);
        } else if (action === 'end-cooling') {
          Store.endAllCooling();
          UI.toast('所有冷静期已提前结束');
        } else if (action === 'clear') {
          UI.confirmDialog({
            title: '清空全部数据？',
            text: '所有商品记录和统计都会被删除，<br>这个操作不能撤销哦。',
            okText: '清空',
          }).then(function (ok) {
            if (!ok) return;
            Store.clearAll();
            UI.toast('数据已清空');
            setTimeout(function () { location.hash = '#/items'; }, 900);
          });
        }
      });
    },
  };

  return { render: render, avatarContent: avatarContent };
})();
