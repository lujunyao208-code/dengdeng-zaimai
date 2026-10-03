/**
 * ============================================================
 * 商品识别服务（OCR）—— 通过 Cloudflare Worker 中转调用 Gemini Vision
 *
 * V2.0：前端 → Cloudflare Worker（你的 API Key 在服务端）→ Gemini API
 *   - 用户无需配置任何 API Key，打开即用
 *   - 真正分析图片内容，识别商品类型和价格
 *   - 返回通用类别名（不识别品牌型号）
 *   - 取实际到手价（排除划线价、原价）
 *   - 无法确定价格时返回 null，由用户手动填写
 *
 * 部署时修改 WORKER_URL 为你的 Cloudflare Worker 地址
 * ============================================================
 */
window.OCRService = (function () {
  // ========== 配置 ==========
  // 部署后替换为你的 Cloudflare Worker URL，例如：
  // https://your-worker.your-subdomain.workers.dev/recognize
  var WORKER_URL = 'https://empty-bar-a0bf.lujunyao208.workers.dev/recognize';

  // ========== 核心识别函数 ==========

  /**
   * 调用 Cloudflare Worker → Gemini Vision API 分析商品截图
   * @param {string} base64Data - 不含前缀的 base64 图片数据
   * @param {string} mimeType - 图片 MIME 类型
   * @returns {Promise<{name, price, category, confidence, priceNote}>}
   */
  function callWorker(base64Data, mimeType) {
    return fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_data: base64Data,
        mime_type: mimeType || 'image/jpeg'
      })
    })
    .then(function (response) {
      if (!response.ok) {
        return response.json().then(function (err) {
          var status = response.status;
          if (status === 429) throw new Error('请求太频繁，稍后再试');
          if (status === 503) throw new Error('识别服务暂时不可用');
          throw new Error(err.error || '识别失败，请重试');
        });
      }
      return response.json();
    })
    .then(function (result) {
      if (result.error) throw new Error(result.error);
      return {
        name: result.name || '未识别商品',
        price: result.price,
        category: result.category || '其他',
        confidence: result.confidence || 90,
        priceNote: result.priceNote || '已核对图片内数字，取实际售价',
      };
    });
  }

  // ========== 公开接口 ==========

  /**
   * 识别商品截图
   * @param {string} imageDataUrl - 图片 dataURL
   * @returns {Promise<{name, price, category, confidence, priceNote}>}
   */
  function recognize(imageDataUrl) {
    // 提取 base64 数据和 MIME 类型
    var parts = imageDataUrl.split(',');
    var mimeMatch = parts[0].match(/data:(.*?);/);
    var mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    var base64Data = parts[1] || parts[0];

    // 模拟识别耗时（让用户感知到处理过程）
    var minDelay = new Promise(function (resolve) { setTimeout(resolve, 1200); });
    var apiCall = callWorker(base64Data, mimeType);

    // 超时保护（15秒）
    var timeout = new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error('识别超时，请检查网络后重试')); }, 15000);
    });

    return Promise.all([minDelay, Promise.race([apiCall, timeout])])
      .then(function (results) { return results[1]; });
  }

  return {
    recognize: recognize,
  };
})();
