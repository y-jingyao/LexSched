// 课程数据服务

const STORAGE_KEY = 'courseList'

/**
 * 获取所有课程
 * @returns {Array} 课程列表
 */
function getAllCourses() {
  const savedCourses = wx.getStorageSync(STORAGE_KEY)
  if (!savedCourses || !Array.isArray(savedCourses)) {
    return []
  }
  return savedCourses.map(course => {
    if (!course.weeks || !Array.isArray(course.weeks)) {
      course.weeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    }
    return course
  })
}

/**
 * 保存课程列表
 * @param {Array} courses - 课程列表
 */
function saveCourses(courses) {
  wx.setStorageSync(STORAGE_KEY, courses)
}

/**
 * 添加课程
 * @param {Object} course - 课程对象
 * @returns {Object} 带 id 的课程对象
 */
function addCourse(course) {
  const courses = getAllCourses()
  const newId = courses.length > 0 ? Math.max(...courses.map(item => item.id)) + 1 : 1
  const newCourse = { ...course, id: newId }
  courses.push(newCourse)
  saveCourses(courses)
  return newCourse
}

/**
 * 更新课程
 * @param {Object} course - 课程对象
 * @returns {boolean} 是否更新成功
 */
function updateCourse(course) {
  const courses = getAllCourses()
  const index = courses.findIndex(item => item.id === course.id)
  if (index > -1) {
    courses[index] = { ...course }
    saveCourses(courses)
    return true
  }
  return false
}

/**
 * 删除课程
 * @param {number} id - 课程 id
 * @returns {boolean} 是否删除成功
 */
function deleteCourse(id) {
  const courses = getAllCourses()
  const newCourses = courses.filter(item => item.id !== id)
  if (newCourses.length !== courses.length) {
    saveCourses(newCourses)
    return true
  }
  return false
}

/**
 * 根据 id 获取课程
 * @param {number} id - 课程 id
 * @returns {Object|null} 课程对象
 */
function getCourseById(id) {
  const courses = getAllCourses()
  return courses.find(item => item.id === id) || null
}

/**
 * 处理课程显示逻辑（带缓存）
 * @param {Array} courses - 课程列表
 * @param {number} currentWeek - 当前周次
 * @param {Object} cache - 缓存对象
 * @returns {Array} 处理后的课程列表
 */
function processCoursesForDisplay(courses, currentWeek, cache) {
  const cacheKey = `${courses.length}-${currentWeek}`
  if (cache && cache.key === cacheKey) {
    return cache.data
  }

  const timeSlots = {}

  courses.forEach(course => {
    const key = `${course.onweek}-${course.startLesson}`
    if (!timeSlots[key]) {
      timeSlots[key] = []
    }
    course.isCurrentWeek = course.weeks && course.weeks.includes(currentWeek)
    timeSlots[key].push(course)
  })

  const result = []
  Object.keys(timeSlots).forEach(key => {
    const slotCourses = timeSlots[key]
    const hasCurrentWeek = slotCourses.some(c => c.isCurrentWeek)

    slotCourses.forEach(course => {
      course.isVisible = hasCurrentWeek ? course.isCurrentWeek : true
      result.push(course)
    })
  })

  return result
}

/**
 * 清除所有课程数据
 */
function clearAllCourses() {
  wx.removeStorageSync(STORAGE_KEY)
}

module.exports = {
  getAllCourses,
  saveCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  getCourseById,
  processCoursesForDisplay,
  clearAllCourses
}
