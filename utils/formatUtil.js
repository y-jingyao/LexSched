// 格式化工具函数

/**
 * 格式化周次显示
 * @param {Array<number>} weeks - 周次数组
 * @returns {string} 格式化后的周次字符串
 */
function formatWeeks(weeks) {
  if (!weeks || weeks.length === 0) return ''
  if (weeks.length === 20) return '全周'

  const ranges = []
  let start = weeks[0]
  let end = weeks[0]

  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i] === end + 1) {
      end = weeks[i]
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`)
      start = weeks[i]
      end = weeks[i]
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`)

  return ranges.join(',') + '周'
}

/**
 * 将周次数组转换为 Set 对象
 * @param {Array<number>} weeks - 周次数组
 * @returns {Object} weeksSet 对象
 */
function weeksToSet(weeks) {
  const weeksSet = {}
  if (weeks && Array.isArray(weeks)) {
    weeks.forEach(w => {
      weeksSet[w] = true
    })
  }
  return weeksSet
}

/**
 * 获取星期名称
 * @param {number} onweek - 星期几 (1-7)
 * @returns {string} 星期名称
 */
function getWeekDayName(onweek) {
  const names = ['一', '二', '三', '四', '五', '六', '日']
  return names[(onweek || 1) - 1] || '一'
}

module.exports = {
  formatWeeks,
  weeksToSet,
  getWeekDayName
}
