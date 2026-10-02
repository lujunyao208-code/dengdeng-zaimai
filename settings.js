/**
 * ============================================================
 * 设置子页面
 * - Pages.settingsProfile 编辑资料（昵称 + 头像：推荐头像 / 相册上传）
 * - Pages.settingsCooling 冷静期偏好（真实功能：宽松 / 标准 / 谨慎）
 * - Pages.settingsAccount 账号与安全（仅说明页，不做真实登录）
 *
 * 原则：不存在「看起来可以点击、实际不能用」的入口；
 * 没有真实能力的入口（如通知设置）直接删除。
 * ============================================================
 */
window.Pages = window.Pages || {};

/* ---------- 编辑资料（我的 → 编辑资料）：昵称 + 头像 ---------- */
Pages.settingsProfile = (function () {

  function render(root) {
    root.innerHTML = '<div class="page"></div>';
    var page = root.firstChild;
    var user = Store.getUser();

    var pendingImage = user.avatarImage; // dataURL 或 null（选推荐头像时清空）
    var pendingIcon = user.avatar;

    function previewHTML() {
      return '<div class="av-preview">' +
        (pendingImage ? '<img src="' + pendingImage + '" alt="头像预览">' : Icons.get(pendingIcon)) +
        '</div>';
    }

    var options = CONFIG.AVATARS.map(function (key) {
      return '<button class="avatar-opt' + (!pendingImage && pendingIcon === key ? ' selected' : '') + '" data-avatar="' + key + '"><span class="ico">' + Icons.get(key) + '</span></button>';
    }).join('');

    page.innerHTML =
      '<div class="detail-head">' +
        '<button class="back-btn" data-act="back">‹</button>' +
        '<span class="dh-title">编辑资料</span>' +
      '</div>' +
      '<div class="paper" style="margin-bottom:14px;">' +
        '<div class="av-preview-wrap">' + previewHTML() + '</div>' +
        '<div class="sheet-actions" style="margin-bottom:4px;">' +
          '<button class="btn btn-main" data-act="pick-file">从相册选择</button>' +
        '</div>' +
        '<input type="file" id="av-input" accept="image/jpeg,image/png,image/webp,image/*" hidden>' +
        '<div class="field"><label>推荐头像</label><div class="avatar-grid">' + options + '</div></div>' +
        '<div class="field" style="margin-top:14px;"><label>昵称</label><input type="text" id="edit-nickname" maxlength="12" placeholder="你的昵称" value="' + UI.esc(user.nickname) + '"></div>' +
        '<div class="sheet-actions" style="margin-top:16px;">' +
          '<button class="btn btn-ghost" data-act="cancel">取消</button>' +
          '<button class="btn btn-main" data-act="save">保存</button>' +
        '</div>' +
      '</div>';

    function refreshPreview() {
      page.querySelector('.av-preview-wrap').innerHTML = previewHTML();
      page.querySelectorAll('.avatar-opt').forEach(function (o) {
        o.classList.toggle('selected', !pendingImage && o.getAttribute('data-avatar') === pendingIcon);
      });
    }

    var input = page.querySelector('#av-input');
    page.querySelector('[data-act="pick-file"]').addEventListener('click', function () {
      input.value = '';
      input.click();
    });
    input.addEventListener('change', function () {
      if (!input.files || !input.files[0]) return;
      UI.readImageFile(input.files[0]).then(function (dataUrl) {
        squareCrop(dataUrl).then(function (cropped) {
          pendingImage = cropped;
          refreshPreview();
        });
      }).catch(function (err) {
        UI.toast(err.message || '图片读取失败，换一张试试～');
      });
    });
    page.querySelectorAll('.avatar-opt').forEach(function (el) {
      el.addEventListener('click', function () {
        pendingImage = null;
        pendingIcon = el.getAttribute('data-avatar');
        refreshPreview();
      });
    });
    page.addEventListener('click', function (e) {
      if (e.target.closest('[data-act="back"]') || e.target.closest('[data-act="cancel"]')) {
        location.hash = '#/profile';
        return;
      }
      if (e.target.closest('[data-act="save"]')) {
        var name = page.querySelector('#edit-nickname').value.trim();
        Store.updateUser({ nickname: name || '昵称', avatar: pendingIcon, avatarImage: pendingImage });
        UI.toast('资料更新好啦');
        location.hash = '#/profile';
      }
    });
  }

  /** 图片居中裁剪为正方形并压缩（头像统一圆形显示，本地保存） */
  function squareCrop(dataUrl) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var side = Math.min(img.width, img.height);
        var sx = (img.width - side) / 2;
        var sy = (img.height - side) / 2;
        var canvas = document.createElement('canvas');
        canvas.width = 240; canvas.height = 240;
        canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, 240, 240);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = function () { reject(new Error('图片读取失败')); };
      img.src = dataUrl;
    });
  }

  return { render: render };
})();

/* ---------- 冷静期偏好 ---------- */
Pages.settingsCooling = (function () {

  function render(root) {
    root.innerHTML = '<div class="page"></div>';
    var page = root.firstChild;
    var mode = Store.getUser().coolingMode || 'standard';

    // 展示顺序：宽松 / 标准 / 谨慎（默认标准）
    var opts = ['relaxed', 'standard', 'cautious'].map(function (key) {
      var m = CONFIG.COOLING_MODES[key];
      return (
        '<button class="set-opt' + (mode === key ? ' selected' : '') + '" data-mode="' + key + '">' +
          '<span class="so-body">' +
            '<span class="so-label">' + m.label + '</span>' +
            '<span class="so-desc">' + m.desc + '</span>' +
          '</span>' +
          '<span class="so-radio"></span>' +
        '</button>'
      );
    }).join('');

    page.innerHTML =
      '<div class="detail-head">' +
        '<button class="back-btn" data-act="back">‹</button>' +
        '<span class="dh-title">冷静期偏好</span>' +
      '</div>' +
      '<div class="paper" style="margin-bottom:14px;">' +
        '<div class="card-title">你希望自己购物时更偏向哪种方式？</div>' +
        opts +
      '</div>' +
      '<p class="set-foot">系统仍会按照商品情况计算冷静期，<br>你的偏好只是让结果整体更偏向宽松或谨慎。</p>';

    page.addEventListener('click', function (e) {
      if (e.target.closest('[data-act="back"]')) {
        location.hash = '#/profile';
        return;
      }
      var opt = e.target.closest('.set-opt');
      if (!opt) return;
      Store.updateUser({ coolingMode: opt.getAttribute('data-mode') });
      UI.toast('冷静期偏好已更新');
      render(document.getElementById('app'));
    });
  }

  return { render: render };
})();

/* ---------- 账号与安全（说明页） ---------- */
Pages.settingsAccount = (function () {

  function render(root) {
    root.innerHTML = '<div class="page"></div>';
    var page = root.firstChild;
    page.innerHTML =
      '<div class="detail-head">' +
        '<button class="back-btn" data-act="back">‹</button>' +
        '<span class="dh-title">账号与安全</span>' +
      '</div>' +
      '<div class="paper" style="margin-bottom:14px;">' +
        '<div class="kv-list">' +
          '<div class="kv-row"><span class="k">当前账号</span><span class="v">本地体验模式</span></div>' +
          '<div class="kv-row"><span class="k">手机号登录</span><span class="v">暂未开启</span></div>' +
          '<div class="kv-row"><span class="k">第三方账号</span><span class="v">暂未开启</span></div>' +
        '</div>' +
      '</div>' +
      '<p class="set-foot">当前为体验版，账号数据暂保存在本地。</p>';

    page.addEventListener('click', function (e) {
      if (e.target.closest('[data-act="back"]')) location.hash = '#/profile';
    });
  }

  return { render: render };
})();
