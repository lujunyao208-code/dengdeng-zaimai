/**
 * ============================================================
 * 图标库 —— 统一的手绘线稿风格 SVG（韩系简洁风）
 *
 * 全部图标：24×24 视口，描边圆头，颜色继承 currentColor，
 * 通过父元素的 color 上色。页面里用 <span class="ico"> 包裹。
 * 以后要换图标，只改这个文件。
 * ============================================================
 */
window.Icons = (function () {

  function svg(inner) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }

  var I = {

    /* ---------- 导航 / 通用 ---------- */
    book: svg('<path d="M12 6.5C10.6 5.3 8.6 4.5 6 4.5v14c2.6 0 4.6.8 6 2 1.4-1.2 3.4-2 6-2v-14c-2.6 0-4.6.8-6 2z"/><path d="M12 6.5v14"/>'),
    person: svg('<circle cx="12" cy="8" r="3.5"/><path d="M5.5 19.5c1.2-3.4 3.6-5 6.5-5s5.3 1.6 6.5 5"/>'),
    plus: svg('<path d="M12 5.5v13M5.5 12h13"/>'),
    chevronLeft: svg('<path d="M14.5 6L8.8 12l5.7 6"/>'),
    chevronRight: svg('<path d="M9.5 6l5.7 6-5.7 6"/>'),

    /* ---------- 状态 ---------- */
    clock: svg('<circle cx="12" cy="12" r="8.3"/><path d="M12 7.8V12l2.9 1.7"/>'),
    bell: svg('<path d="M6.5 16.5v-5.2a5.5 5.5 0 0 1 11 0v5.2l1.8 2.5H4.7l1.8-2.5z"/><path d="M10.3 19.8a1.8 1.8 0 0 0 3.4 0"/>'),
    check: svg('<path d="M5 12.7l4.4 4.4L19 7.5"/>'),
    leaf: svg('<path d="M5.5 19C5.5 11 9.5 5.5 19 5.5c0 9.5-5.5 13.5-13.5 13.5z"/><path d="M5.5 19c2-4.5 5.5-8 10-11"/>'),
    repeat: svg('<path d="M17.5 3.5l2.8 2.8-2.8 2.8"/><path d="M20.3 6.3H8a4.2 4.2 0 0 0-4.2 4.2v.9"/><path d="M6.5 20.5l-2.8-2.8 2.8-2.8"/><path d="M3.7 17.7H16a4.2 4.2 0 0 0 4.2-4.2v-.9"/>'),

    /* ---------- 功能图标 ---------- */
    camera: svg('<path d="M8.8 6.5L10 4.5h4l1.2 2H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 18.5H5A1.5 1.5 0 0 1 3.5 17V8A1.5 1.5 0 0 1 5 6.5h3.8z"/><circle cx="12" cy="12.8" r="3.5"/>'),
    heart: svg('<path d="M12 19.5s-6.8-4.3-6.8-9.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 6.8 3c0 4.9-6.8 9.2-6.8 9.2z"/>'),
    bag: svg('<path d="M6.2 8.5h11.6l1 11.5H5.2l1-11.5z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>'),
    receipt: svg('<path d="M6.5 3.5h11v17l-2.1-1.4-1.7 1.4-1.7-1.4-1.7 1.4-1.7-1.4-2.1 1.4v-17z"/><path d="M9.5 8h5M9.5 11.5h5"/>'),
    chat: svg('<path d="M4 5.5h16v10.5H9l-5 3.5v-14z"/><path d="M8.5 10h7M8.5 13h4.5"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    hourglass: svg('<path d="M6.5 3.5h11M6.5 20.5h11M8 3.5c0 4.4 4 4.4 4 8.5s-4 4.1-4 8.5M16 3.5c0 4.4-4 4.4-4 8.5s4 4.1 4 8.5"/>'),
    lock: svg('<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/><circle cx="12" cy="15.2" r="1.2" fill="currentColor" stroke="none"/>'),
    info: svg('<circle cx="12" cy="12" r="8.3"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".6" fill="currentColor" stroke="none"/>'),
    pencil: svg('<path d="M17.5 3.5l3 3L8.5 18.5l-4.3 1 1-4.3 12.3-12.7z"/>'),
    refresh: svg('<path d="M4.5 4.5V10h5.5"/><path d="M4.7 15.5a8.5 8.5 0 1 0 2-8.8l-2.2 3.3"/>'),
    calculator: svg('<rect x="5.5" y="3" width="13" height="18" rx="2"/><path d="M9 6.8h6"/><circle cx="9" cy="11.5" r=".6" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r=".6" fill="currentColor" stroke="none"/><circle cx="15" cy="11.5" r=".6" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r=".6" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r=".6" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r=".6" fill="currentColor" stroke="none"/><path d="M9 18.8h6"/>'),
    forward: svg('<path d="M10.5 6L17 12l-6.5 6"/><path d="M4.5 6L11 12l-6.5 6"/>'),
    trash: svg('<path d="M4 6.5h16"/><path d="M8.5 6.5v-2A1.5 1.5 0 0 1 10 3h4a1.5 1.5 0 0 1 1.5 1.5v2"/><path d="M18.5 6.5l-.8 12.6a2 2 0 0 1-2 1.9H8.3a2 2 0 0 1-2-1.9L5.5 6.5"/><path d="M10 11v5.5M14 11v5.5"/>'),
    sparkles: svg('<path d="M12 4.5l1.6 3.9 3.9 1.6-3.9 1.6L12 15.5l-1.6-3.9-3.9-1.6 3.9-1.6L12 4.5z"/><path d="M19 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z"/>'),

    /* ---------- 成本档次 ---------- */
    cup: svg('<path d="M6 9h11v4.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 6 13.5V9z"/><path d="M17 5.5l1.8 5.3-1.9.7L15 6.2"/><path d="M8.7 6.4V5M11.5 6.4V4.4M14.3 6.4V5"/>'),
    mug: svg('<path d="M5.5 8h12v5.5a4.5 4.5 0 0 1-4.5 4.5h-3A4.5 4.5 0 0 1 5.5 13.5V8z"/><path d="M17.5 9.5h1a2.5 2.5 0 0 1 0 5h-1"/><path d="M9 5.8V4.6M12 5.8V4M15 5.8V4.6"/>'),
    gem: svg('<path d="M6.5 4.5h11L21 9.5l-9 10-9-10 3.5-5z"/><path d="M3 9.5h18"/><path d="M9.7 4.5L12 9.5l2.3-5"/><path d="M12 19.5l-3-10M12 19.5l3-10"/>'),
    crown: svg('<path d="M4 8.5l4.3 3.7L12 6l3.7 6.2L20 8.5v8.3a1.7 1.7 0 0 1-1.7 1.7H5.7A1.7 1.7 0 0 1 4 16.8V8.5z"/><path d="M5.7 20.5h12.6"/>'),

    /* ---------- 商品类别 ---------- */
    shirt: svg('<path d="M20.4 3.5L16.2 2a4 4 0 0 1-8.4 0L3.6 3.5a2 2 0 0 0-1.4 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.2a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.4-2.2z"/>'),
    lipstick: svg('<path d="M9.5 3.5h5v5.6a2.5 2.5 0 0 1-5 0V3.5z"/><path d="M12 11.6V20.5"/><path d="M8.8 20.5h6.4"/>'),
    ring: svg('<circle cx="12" cy="15" r="4.8"/><path d="M12 4.2l2.4 3.6-2.4 1.7-2.4-1.7 2.4-3.6z"/>'),
    home: svg('<path d="M4.5 10.5L12 4l7.5 6.5"/><path d="M6.5 9.5V20h11V9.5"/><path d="M10 20v-5.5h4V20"/>'),
    headphones: svg('<path d="M3.5 18v-6a8.5 8.5 0 0 1 17 0v6"/><path d="M21 19.2a2 2 0 0 1-2 1.8h-1a2 2 0 0 1-2-1.8v-3.4a2 2 0 0 1 2-1.8h3v5.2zM3 19.2a2 2 0 0 0 2 1.8h1a2 2 0 0 0 2-1.8v-3.4a2 2 0 0 0-2-1.8H3v5.2z"/>'),
    cake: svg('<path d="M5 20.5h14V13H5v7.5z"/><path d="M5 13c1.4-1.3 3.1-1.3 4.5 0s3.1 1.3 4.5 0 3.1-1.3 4.5 0"/><path d="M12 9.5V5.5M12 5.5c-.8-.9-.8-1.8 0-2.5.8.7.8 1.6 0 2.5z"/>'),
    bookClosed: svg('<path d="M4.5 4.5A2.5 2.5 0 0 1 7 2h12.5v16.5H7a2.5 2.5 0 0 0-2.5 2.5v-16.5z"/>'),

    /* ---------- 头像（线稿表情/图案） ---------- */
    bear: svg('<circle cx="12" cy="13.5" r="7"/><circle cx="5.6" cy="7.2" r="2.4"/><circle cx="18.4" cy="7.2" r="2.4"/><circle cx="9.3" cy="12.8" r=".5" fill="currentColor" stroke="none"/><circle cx="14.7" cy="12.8" r=".5" fill="currentColor" stroke="none"/><ellipse cx="12" cy="15" rx="1.2" ry=".8"/><path d="M12 15.8v.9"/><path d="M10.6 17.2c.9.6 1.9.6 2.8 0"/>'),
    flower: svg('<circle cx="12" cy="12" r="2.2"/><ellipse cx="12" cy="5.6" rx="1.9" ry="3"/><ellipse cx="12" cy="18.4" rx="1.9" ry="3"/><ellipse cx="5.6" cy="12" rx="3" ry="1.9"/><ellipse cx="18.4" cy="12" rx="3" ry="1.9"/>'),
    star: svg('<path d="M12 4l2.2 4.6 5.1.7-3.7 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.7 9.3l5.1-.7L12 4z"/>'),
    moon: svg('<path d="M19.5 14.2A8.2 8.2 0 1 1 9.8 4.5a6.6 6.6 0 0 0 9.7 9.7z"/>'),
    bunny: svg('<ellipse cx="9.6" cy="6.4" rx="1.9" ry="3.6" transform="rotate(-12 9.6 6.4)"/><ellipse cx="14.4" cy="6.4" rx="1.9" ry="3.6" transform="rotate(12 14.4 6.4)"/><circle cx="12" cy="14" r="5.8"/><circle cx="10.2" cy="13.6" r=".5" fill="currentColor" stroke="none"/><circle cx="13.8" cy="13.6" r=".5" fill="currentColor" stroke="none"/><path d="M12 15.2c1.3 0 2.1.7 2.4 1.3-.9.5-1.6.5-2.4.5s-1.5 0-2.4-.5c.3-.6 1.1-1.3 2.4-1.3z"/>'),
    clover: svg('<circle cx="9.2" cy="9" r="2.8"/><circle cx="14.8" cy="9" r="2.8"/><circle cx="9.2" cy="15" r="2.8"/><circle cx="14.8" cy="15" r="2.8"/><path d="M12 17.8v2.7"/>'),
  };

  /** 取图标（key 不存在时回退到小熊） */
  I.get = function (key) {
    return I[key] || I.bear;
  };

  return I;
})();
