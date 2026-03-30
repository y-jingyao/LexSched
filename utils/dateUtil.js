// 日期工具函数

/**
 * 格式化日期为 YYYY/M/D 格式
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}/${month}/${day}`
}

/**
 * 判断两个日期是否是同一天
 * @param {Date} date1 - 日期1
 * @param {Date} date2 - 日期2
 * @returns {boolean} 是否是同一天
 */
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

/**
 * 计算当前是本学期的第几周
 * @param {Date} date - 当前日期
 * @param {Date} semesterStart - 学期开始日期
 * @returns {number} 周次
 */
function calculateWeekNumber(date, semesterStart) {
  if (!semesterStart || isNaN(semesterStart.getTime())) {
    semesterStart = new Date(2026, 2, 9)
  }

  const diffTime = date.getTime() - semesterStart.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const weekNumber = Math.floor(diffDays / 7) + 1
  return weekNumber > 0 ? weekNumber : 1
}

/**
 * 生成一周日期数据
 * @param {Date} date - 基准日期
 * @returns {Array} 一周日期数据
 */
function generateWeekDays(date) {
  const weekDays = []
  const weekDayNames = ['一', '二', '三', '四', '五', '六', '日']
  const currentDay = date.getDay()
  const currentWeekDay = currentDay === 0 ? 7 : currentDay

  const monday = new Date(date)
  monday.setDate(date.getDate() - currentWeekDay + 1)

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday)
    dayDate.setDate(monday.getDate() + i)

    weekDays.push({
      weekDay: weekDayNames[i],
      day: dayDate.getDate(),
      isToday: isSameDay(dayDate, date)
    })
  }

  return weekDays
}

/**
 * 获取学期开始日期
 * @returns {Date|null} 学期开始日期
 */
function getSemesterStartDate() {
  const savedDate = wx.getStorageSync('semesterStartDate')
  return savedDate ? new Date(savedDate) : null
}

module.exports = {
  formatDate,
  isSameDay,
  calculateWeekNumber,
  generateWeekDays,
  getSemesterStartDate
}
