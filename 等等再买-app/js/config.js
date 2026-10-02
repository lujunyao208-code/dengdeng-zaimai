/**
 * ============================================================
 * 业务规则配置 —— 「等等再买」所有产品规则集中在这里
 *
 * 页面代码中不允许出现散落的魔法数字：
 * 以后要调整使用频率换算 / 冷静期规则 / 问题文案，只改这个文件。
 * ============================================================
 */
window.CONFIG = {

  APP_NAME: '等等再买',
  TAGLINE: '给冲动一点时间，也给自己多一点思考。',

  /**
   * 预计使用时间（问题1的选项 → 月数）
   * V1.1：冷静期不再看总价，而是「价格 ÷ 预计使用次数 = 单次使用成本」。
   */
  USAGE_DURATIONS: [
    { label: '1周左右',   months: 0.25 },
    { label: '1个月左右', months: 1 },
    { label: '3个月左右', months: 3 },
    { label: '6个月左右', months: 6 },
    { label: '1年左右',   months: 12 },
    { label: '1年以上',   months: 18 },
  ],

  /**
   * 使用频率（问题2的选项 → 次/月）
   */
  USAGE_FREQUENCIES: [
    { label: '每天',        perMonth: 30 },
    { label: '每周3–6次',   perMonth: 18 },
    { label: '每周1–2次',   perMonth: 6 },
    { label: '每月几次',    perMonth: 3 },
    { label: '偶尔使用',    perMonth: 1 },
  ],

  /** 预计使用次数下限 / 上限（防止结果过于极端） */
  USAGE_MIN: 1,
  USAGE_MAX: 1000,

  /**
   * 基础冷静期：按商品总价分档（天）。
   * 档内取中间值（0.5/1.5/3.5），最终与单次成本修正相加后四舍五入，
   * 落在文档给出的「0–1天」「1–2天」「3–4天」区间内。
   */
  PRICE_BASE_COOLING: [
    { maxPrice: 50,      days: 0 },
    { maxPrice: 100,     days: 0.5 },
    { maxPrice: 200,     days: 1 },
    { maxPrice: 300,     days: 1.5 },
    { maxPrice: 500,     days: 2 },
    { maxPrice: 800,     days: 3 },
    { maxPrice: 1200,    days: 3.5 },
    { maxPrice: Infinity, days: 4 },
  ],

  /** 单次使用成本修正（天）：在基础冷静期上叠加 */
  COST_COOLING_ADJ: [
    { maxCost: 5,        add: 0 },
    { maxCost: 10,       add: 0.5 },
    { maxCost: 20,       add: 0.5 },
    { maxCost: 50,       add: 1 },
    { maxCost: Infinity, add: 1 },
  ],

  /** 购买欲望修正（天）：欲望越高反而适当缩短，保证执行率 */
  DESIRE_COOLING_ADJ: [
    { maxDesire: 60,  add: 0 },
    { maxDesire: 80,  add: -1 },
    { maxDesire: 100, add: -2 },
  ],

  /** 使用场景修正（天）：明确场景（旅游/演唱会等）有时间需求，适当缩短 */
  SCENARIO_COOLING_ADJ: {
    '日常使用': 0,
    '特定场景': -1,
    '暂时没有明确场景': 0,
  },

  /** 冷静期最终界限：最短 0 天，最长 5 天 */
  COOLING_MIN_DAYS: 0,
  COOLING_MAX_DAYS: 5,

  /**
   * 冷静期偏好：用户可在「我的 → 冷静期偏好」切换。
   * 不是让用户自设固定天数，而是系统照常计算后按偏好整体调整。
   * 映射按「标准天数 → 调整后天数」定义，最终仍限制在 0–5 天。
   */
  COOLING_MODES: {
    standard: { key: 'standard', label: '标准', desc: '给自己一点时间想清楚' },
    relaxed: {
      key: 'relaxed', label: '宽松', desc: '真的想买就别等太久',
      map: { 0: 0, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 },
    },
    cautious: {
      key: 'cautious', label: '谨慎', desc: '希望多考虑一下再决定',
      map: { 0: 0, 1: 2, 2: 3, 3: 4, 4: 5, 5: 5 },
    },
  },

  /** 购买欲望滑块的默认值（%） */
  DESIRE_DEFAULT: 70,

  /** 结果页结论文案：按「冲动程度 / 单次成本 / 总价」综合给出 */
  VERDICTS: {
    impulse: { title: '可能有点冲动', copy: '好像更多是突然的心动，再确认一下是不是真的需要它。' },
    worth:   { title: '看起来比较值得', copy: '每次用下来挺划算的。' },
    ok:      { title: '可以考虑一下', copy: '喜欢的话，也不用着急。' },
    pricy:   { title: '有点贵，可以再想想', copy: '这是一笔不小的开销，值得多考虑两天。' },
  },

  /** 商品类别（icon = js/icons.js 里的图标 key） */
  CATEGORIES: [
    { key: '服饰', icon: 'shirt' },
    { key: '美妆', icon: 'lipstick' },
    { key: '饰品', icon: 'ring' },
    { key: '家居', icon: 'home' },
    { key: '数码', icon: 'headphones' },
    { key: '食品', icon: 'cake' },
    { key: '书籍', icon: 'bookClosed' },
    { key: '其他', icon: 'bag' },
  ],

  /** 可选头像（js/icons.js 里的图标 key） */
  AVATARS: ['flower', 'bear', 'bunny', 'star', 'moon', 'heart', 'leaf', 'clover'],

  /**
   * 一次一个的问题（核心交互）
   * 顺序执行，前两问决定预计使用次数（使用频率 × 使用时间），
   * 第 3 问是购买欲望滑块（0–100%），第 4 问是使用场景，
   * 全部答案会记录在商品的 answers 里。
   * type: 'options' 常规选项；'slider' 百分比滑块。
   * notes: 与 options 平行的补充说明（可选）。
   */
  QUESTIONS: [
    {
      id: 'duration',
      intro: '我们先想一个小问题～',
      title: '你预计会用多久？',
      options: ['1周左右', '1个月左右', '3个月左右', '6个月左右', '1年左右', '1年以上'],
    },
    {
      id: 'frequency',
      intro: '好～那再想想',
      title: '你大概多久使用一次？',
      options: ['每天', '每周3–6次', '每周1–2次', '每月几次', '偶尔使用'],
    },
    {
      id: 'desire',
      intro: '再问你一个～',
      title: '你现在有多想买它？',
      type: 'slider',
      default: 70,
    },
    {
      id: 'scenario',
      intro: '最后想一下：',
      title: '你准备在什么情况下使用它？',
      options: ['日常使用', '特定场景', '暂时没有明确场景'],
      notes: ['日常穿、上班上学', '旅游、演唱会、聚会', '被种草、一时冲动'],
    },
  ],

  /** 商品状态（icon = js/icons.js 里的图标 key） */
  STATUS: {
    cooling:    { key: 'cooling',    label: '冷静中',   icon: 'clock' },
    bought:     { key: 'bought',     label: '已购买',   icon: 'check' },
    abandoned:  { key: 'abandoned',  label: '已放弃',   icon: 'leaf' },
    hesitating: { key: 'hesitating', label: '继续犹豫', icon: 'repeat' },
  },

  /** 冷静期结束后的三个选择（icon = js/icons.js 里的图标 key） */
  DECISIONS: [
    { action: 'bought',    icon: 'bag',    label: '还是想买', note: '记录为：已购买' },
    { action: 'abandoned', icon: 'leaf',   label: '不买了',   note: '记录为：已放弃，金额计入省下的钱' },
    { action: 'hesitate',  icon: 'repeat', label: '还在犹豫', note: '允许：再冷静一次' },
  ],

  /* ------------------------------------------------------------
   * 计算函数
   * ---------------------------------------------------------- */

  /**
   * 预计使用次数 = 使用频率（次/月） × 预计使用时间（月）
   * 结果限制在 [USAGE_MIN, USAGE_MAX] 之间。
   */
  expectedUsageFor: function (durationLabel, frequencyLabel) {
    var months = 0, perMonth = 0, i;
    for (i = 0; i < this.USAGE_DURATIONS.length; i++) {
      if (this.USAGE_DURATIONS[i].label === durationLabel) months = this.USAGE_DURATIONS[i].months;
    }
    for (i = 0; i < this.USAGE_FREQUENCIES.length; i++) {
      if (this.USAGE_FREQUENCIES[i].label === frequencyLabel) perMonth = this.USAGE_FREQUENCIES[i].perMonth;
    }
    if (!months || !perMonth) return 0;
    var times = Math.round(perMonth * months);
    if (times < this.USAGE_MIN) times = this.USAGE_MIN;
    if (times > this.USAGE_MAX) times = this.USAGE_MAX;
    return times;
  },

  /** 单次使用成本 = 商品价格 ÷ 预计使用次数 */
  calcCostPerUse: function (price, timesPerYear) {
    if (!timesPerYear || timesPerYear <= 0) return 0;
    return Math.round((price / timesPerYear) * 100) / 100;
  },

  /**
   * 最终冷静期（天）：四因素综合判断。
   * ① 商品总价 → 基础冷静期
   * ② 单次使用成本 → 修正（贵 +0.5~1 天）
   * ③ 购买欲望（0–100%）→ 修正（欲望高反而缩短，保执行率）
   * ④ 使用场景 → 修正（旅游/演唱会等明确场景 -1 天）
   * 最终四舍五入到整数天，并限制在 0–5 天。
   * 计算内部使用精确数值，展示层另做约数处理。
   */
  computeCoolingDays: function (price, costPerUse, desirePct, scenario) {
    var i, base = 0, adj = 0;
    for (i = 0; i < this.PRICE_BASE_COOLING.length; i++) {
      if (price <= this.PRICE_BASE_COOLING[i].maxPrice) { base = this.PRICE_BASE_COOLING[i].days; break; }
    }
    for (i = 0; i < this.COST_COOLING_ADJ.length; i++) {
      if (costPerUse <= this.COST_COOLING_ADJ[i].maxCost) { adj += this.COST_COOLING_ADJ[i].add; break; }
    }
    for (i = 0; i < this.DESIRE_COOLING_ADJ.length; i++) {
      if (desirePct <= this.DESIRE_COOLING_ADJ[i].maxDesire) { adj += this.DESIRE_COOLING_ADJ[i].add; break; }
    }
    var sAdj = this.SCENARIO_COOLING_ADJ[scenario];
    if (sAdj != null) adj += sAdj;
    var days = Math.round(base + adj);
    if (days < this.COOLING_MIN_DAYS) days = this.COOLING_MIN_DAYS;
    if (days > this.COOLING_MAX_DAYS) days = this.COOLING_MAX_DAYS;
    return days;
  },

  /** 按冷静期偏好调整天数（标准模式原样返回，结果仍在 0–5 天） */
  adjustCoolingDays: function (baseDays, modeKey) {
    var mode = this.COOLING_MODES[modeKey];
    if (!mode || !mode.map) return baseDays;
    return mode.map[baseDays] != null ? mode.map[baseDays] : baseDays;
  },

  /** 结果页结论文案：冲动提醒 > 划算 > 小件 > 偏贵 */
  verdictFor: function (price, costPerUse, desirePct, scenario) {
    if (scenario === '暂时没有明确场景' && desirePct >= 81) return this.VERDICTS.impulse;
    if (costPerUse <= 5) return this.VERDICTS.worth;
    if (price <= 200 && costPerUse <= 10) return this.VERDICTS.ok;
    if (price <= 50) return this.VERDICTS.ok;
    return this.VERDICTS.pricy;
  },

  /** 小时数 → 展示文案（0小时 → 0天） */
  hoursLabel: function (hours) {
    var h = Number(hours || 0);
    return h === 0 ? '0天' : (h / 24) + '天';
  },

  /** 商品价格展示为约数：<10 不取整；<1000 取整到十位；≥1000 取整到百位 */
  approxPrice: function (price) {
    var p = Number(price || 0);
    if (p < 10) return Math.round(p);
    if (p < 1000) return Math.round(p / 10) * 10;
    return Math.round(p / 100) * 100;
  },

  /** 单次使用成本展示为约数：四舍五入到整数元 */
  approxCost: function (cost) {
    return Math.round(Number(cost || 0));
  },

  /** 按类别 key 找图标 key（js/icons.js） */
  categoryIcon: function (categoryKey) {
    for (var i = 0; i < this.CATEGORIES.length; i++) {
      if (this.CATEGORIES[i].key === categoryKey) return this.CATEGORIES[i].icon;
    }
    return 'bag';
  },
};
