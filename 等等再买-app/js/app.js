/**
 * ============================================================
 * 应用入口：路由 / 底部导航 / 定时刷新
 *
 * 路由（hash）：
 *   #/items              我的物品
 *   #/add                添加新物品
 *   #/profile            我的
 *   #/detail/:id         商品详情
 *   #/about              关于
 *   #/settings/profile   编辑资料
 *   #/settings/cooling   冷静期偏好
 *   #/settings/account   账号与安全
 * ============================================================
 */
window.App = (function () {
  var appEl;
  var currentRoute = null;
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (parts[0] === 'detail' && parts[1]) return { name: 'detail', id: parts[1] };
    if (parts[0] === 'settings' && parts[1] === 'profile') return { name: 'settingsProfile' };
    if (parts[0] === 'settings' && parts[1] === 'cooling') return { name: 'settingsCooling' };
    if (parts[0] === 'settings' && parts[1] === 'account') return { name: 'settingsAccount' };
    if (parts[0] === 'about') return { name: 'about' };
    if (parts[0] === 'add') return { name: 'add' };
    if (parts[0] === 'profile') return { name: 'profile' };
    return { name: 'items' };
  }
  function render(animate) {
    var route = parseHash();
    currentRoute = route;
    appEl.classList.toggle('silent', animate === false);
    if (route.name === 'detail') Pages.detail.render(appEl, route.id);
    else if (route.name === 'about') Pages.about.render(appEl);
    else Pages[route.name].render(appEl);
    if (animate !== false) {
      appEl.classList.remove('page-enter');
      void appEl.offsetWidth;
      appEl.classList.add('page-enter');
    }
    updateTabbar(route);
    window.scrollTo(0, 0);
  }
  function currentPage() {
    return currentRoute ? currentRoute.name : parseHash().name;
  }
  /* ---------- 底部导航 ---------- */
  function updateTabbar(route) {
    var subOfProfile = route.name === 'about' || route.name === 'settingsProfile' || route.name === 'settingsCooling' || route.name === 'settingsAccount';
    var tabs = document.querySelectorAll('#tabbar .tab');
    tabs.forEach(function (tab) {
      var r = tab.getAttribute('data-route');
      tab.classList.toggle('active', r === route.name || (subOfProfile && r === 'profile'));
    });
  }
  function bindTabbar() {
    document.getElementById('tabbar').addEventListener('click', function (e) {
      var tab = e.target.closest('.tab');
      if (!tab) return;
      var r = tab.getAttribute('data-route');
      if (r === parseHash().name) return;
      location.hash = '#/' + r;
    });
  }
  /* ---------- 定时刷新倒计时与状态 ---------- */
  var tickTimer = null;
  function startTick() {
    tickTimer = setInterval(function () {
      if (document.hidden) return;
      var r = parseHash();
      if (r.name === 'items' || r.name === 'detail' || r.name === 'profile') {
        render(false);
      }
    }, 30000);
  }
  function init() {
    appEl = document.getElementById('app');
    Store.load();
    bindTabbar();
    window.addEventListener('hashchange', function () { render(true); });
    startTick();
    render(true);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  return { render: render, currentPage: currentPage };
})();
