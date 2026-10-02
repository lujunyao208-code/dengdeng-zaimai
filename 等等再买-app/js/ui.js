/**
 * ============================================================
 * 通用 UI 工具：格式化 / 提示 / 弹出层 / 图片处理
 * ============================================================
 */
window.UI = (function () {

  /* ---------- 文本 ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** 金额：1280 → ¥1,280 */
  function money(n) {
    return '¥' + Number(n || 0).toLocaleString('zh-CN');
  }

  /** 商品价格展示为约数：299 → 约 ¥300（内部计算仍用精确值） */
  function approxPrice(n) {
    return '约 ¥' + Number(CONFIG.approxPrice(n) || 0).toLocaleString('zh-CN');
  }

  /** 单次使用成本展示为约数：5.54 → 约 ¥6/次 */
  function approxCost(c) {
    return '约 ¥' + CONFIG.approxCost(c) + '/次';
  }

  /** 日期：9月28日 */
  function dateCN(iso) {
    var d = new Date(iso);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  /** 日期时间：9月28日 14:30 */
  function dateTimeCN(iso) {
    var d = new Date(iso);
    var hh = ('0' + d.getHours()).slice(-2);
    var mm = ('0' + d.getMinutes()).slice(-2);
    return dateCN(iso) + ' ' + hh + ':' + mm;
  }

  /** 剩余时间文案：还剩2天13小时 / 还剩5小时 / 还剩45分钟 */
  function remainingText(rem) {
    if (rem.over) return '已结束';
    if (rem.days > 0) {
      return '还剩' + rem.days + '天' + (rem.hours > 0 ? rem.hours + '小时' : '');
    }
    if (rem.hours > 0) {
      return '还剩' + rem.hours + '小时' + (rem.minutes > 0 ? rem.minutes + '分钟' : '');
    }
    return '还剩' + Math.max(1, rem.minutes) + '分钟';
  }

  /** 冷静期天数文案（用于「你X天前想买的」） */
  function daysSince(iso) {
    var ms = Date.now() - new Date(iso).getTime();
    return Math.max(1, Math.round(ms / 86400000));
  }

  /* ---------- 提示 ---------- */
  var toastTimer = null;
  function toast(msg, duration) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, duration || 2200);
  }

  /* ---------- 底部弹出层 ---------- */
  function openSheet(html) {
    closeSheet();
    var root = document.getElementById('sheet-root');
    var mask = document.createElement('div');
    mask.className = 'sheet-mask';
    mask.innerHTML = '<div class="sheet" role="dialog">' + html + '</div>';
    mask.addEventListener('click', function (e) {
      if (e.target === mask) closeSheet();
    });
    root.appendChild(mask);
    return mask;
  }
  function closeSheet() {
    var root = document.getElementById('sheet-root');
    root.innerHTML = '';
  }

  /** 确认对话框，返回 Promise<boolean> */
  function confirmDialog(opts) {
    return new Promise(function (resolve) {
      var mask = openSheet(
        '<div class="sheet-title">' + esc(opts.title || '确认一下～') + '</div>' +
        '<p style="text-align:center;color:var(--ink-soft);font-size:14.5px;line-height:1.8;">' + esc(opts.text || '') + '</p>' +
        '<div class="sheet-actions">' +
          '<button class="btn btn-ghost" data-act="cancel">' + esc(opts.cancelText || '再想想') + '</button>' +
          '<button class="btn btn-main" data-act="ok">' + esc(opts.okText || '确定') + '</button>' +
        '</div>'
      );
      mask.querySelector('[data-act="cancel"]').addEventListener('click', function () {
        closeSheet(); resolve(false);
      });
      mask.querySelector('[data-act="ok"]').addEventListener('click', function () {
        closeSheet(); resolve(true);
      });
    });
  }

  /* ---------- 图片处理 ---------- */
  /**
   * 读取并压缩图片 → dataURL。
   * 限制尺寸以控制 localStorage 占用（本地存储上限约 5MB）。
   */
  function readImageFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type || file.type.indexOf('image/') !== 0) {
        reject(new Error('请选择图片文件'));
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var maxSide = 480;
          var scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          var w = Math.round(img.width * scale);
          var h = Math.round(img.height * scale);
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.78));
        };
        img.onerror = function () { reject(new Error('图片读取失败')); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error('文件读取失败')); };
      reader.readAsDataURL(file);
    });
  }

  return {
    esc: esc,
    money: money,
    approxPrice: approxPrice,
    approxCost: approxCost,
    dateCN: dateCN,
    dateTimeCN: dateTimeCN,
    remainingText: remainingText,
    daysSince: daysSince,
    toast: toast,
    openSheet: openSheet,
    closeSheet: closeSheet,
    confirmDialog: confirmDialog,
    readImageFile: readImageFile,
  };
})();
