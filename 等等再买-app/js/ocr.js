/**
 * ============================================================
 * 商品识别服务（OCR）—— 接口 + Mock 实现
 *
 * 当前为 Mock：根据图片内容哈希，从模拟商品库中返回一个结果。
 * 同一张图片每次识别的结果一致（模拟真实 OCR 的确定性），
 * 不同图片会得到不同的模拟结果。
 *
 * V1.1 价格识别优化（模拟真实 OCR 的「价格核对」行为）：
 *   - price 一律为「实际到手价」：有划线价时取券后/活动价，而不是原价；
 *   - 明确排除：商品编号、销售数量、满减金额、其他商品价格；
 *   - priceNote 说明本次取价依据，展示在确认页供用户核对；
 *   - 用户始终可以在确认页手动修改价格，修改后自动重算。
 *
 * V1.2 识别结果优化：
 *   - 类别识别优先恢复：name 恢复为通用类别名（如「运动鞋」「T恤」），
 *     不识别品牌、型号、花色（不返回「某某品牌某某系列」这类结果）；
 *   - 无法确定价格时不编造：price 返回 null，priceNote 说明
 *     「暂未确定准确价格，请确认」，由用户在确认页填写价格。
 *
 * TODO 接入真实 OCR / 商品识别 API（如阿里云 / 腾讯云）时：
 *   1. 把 recognize() 内部替换为真实后端调用；
 *   2. 返回结构保持 { name, price, category, confidence, priceNote } 不变；
 *   3. 所有调用方（添加页）无需任何改动；
 *   4. 真实实现必须在 prompt 中执行与上面相同的价格核对、类别优先、
 *      不确定价格不编造规则。
 * ============================================================
 */
window.OCRService = (function () {

  /**
   * 模拟商品库：
   *   markedPrice = 划线价/原价（OCR 应识别但正确排除），price = 实际到手价；
   *   price: null = 无法确定价格，不编造，交给用户确认（priceNote 说明）。
   */
  var MOCK_CATALOG = [
    { name: '连衣裙', price: 299, category: '服饰' },
    { name: '蓝牙耳机', price: 899, markedPrice: 1099, priceNote: '已取到手价，排除划线价 ¥1,099', category: '数码' },
    { name: '香水', price: 399, category: '美妆' },
    { name: '帆布托特包', price: 129, markedPrice: 189, priceNote: '已取券后价，排除划线价 ¥189', category: '服饰' },
    { name: '胶囊咖啡机', price: 1299, markedPrice: 1599, priceNote: '已取活动价，排除划线价 ¥1,599', category: '家居' },
    { name: '口红', price: null, priceNote: '暂未确定准确价格，请确认', category: '美妆' },
    { name: '拍立得相机', price: 799, category: '数码' },
    { name: '运动鞋', price: null, priceNote: '暂未确定准确价格，请确认', category: '服饰' },
    { name: '香薰蜡烛', price: 89, category: '家居' },
    { name: '项链', price: 259, category: '饰品' },
    { name: '针织开衫', price: 459, markedPrice: 559, priceNote: '已取到手价，排除划线价 ¥559', category: '服饰' },
    { name: '草莓蛋糕', price: 68, category: '食品' },
    { name: '保温杯', price: null, priceNote: '暂未确定准确价格，请确认', category: '其他' },
    { name: '手账本', price: 156, category: '书籍' },
  ];

  /** 图片内容哈希（djb2）—— 同一张图 → 同一个结果 */
  function hashOf(dataUrl) {
    var h = 5381;
    var s = String(dataUrl);
    // 只采样一部分字符，避免大图哈希过慢
    var step = Math.max(1, Math.floor(s.length / 3000));
    for (var i = 0; i < s.length; i += step) {
      h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  /** 模拟识别耗时（真实 OCR 需要一点时间，保留这个等待体验） */
  var MOCK_DELAY_MS = 1400;

  /**
   * 识别商品截图
   * @param {string} imageDataUrl 图片 dataURL
   * @returns {Promise<{name: string, price: number, category: string, confidence: number, priceNote: string}>}
   */
  function recognize(imageDataUrl) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        var idx = hashOf(imageDataUrl) % MOCK_CATALOG.length;
        var item = MOCK_CATALOG[idx];
        resolve({
          name: item.name,
          price: item.price, // 实际到手价；null = 无法确定价格，不编造
          category: item.category,
          confidence: Math.round(86 + (hashOf(imageDataUrl + 'c') % 13)), // 86%~98%
          priceNote: item.priceNote || '已核对图片内数字，取实际售价',
        });
      }, MOCK_DELAY_MS);
    });
  }

  return { recognize: recognize };
})();
