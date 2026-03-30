//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    colorArrays: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE"],
    weekDays: [],
    currentDate: '',
    currentWeek: 1,
    currentMonth: '',
    timeList: [
      { start: "08:00", end: "08:50" },
      { start: "08:55", end: "09:45" },
      { start: "10:15", end: "11:05" },
      { start: "11:10", end: "12:00" },
      { start: "14:00", end: "14:50" },
      { start: "14:55", end: "15:45" },
      { start: "16:15", end: "17:05" },
      { start: "17:10", end: "18:00" },
      { start: "19:00", end: "19:50" },
      { start: "19:55", end: "20:45" }
    ],
    wlist: [
    ],
    showModal: false,
    modalType: '', // 'add', 'edit', 'detail'
    currentCourse: null,
    formData: {
        courseName: '',
        teacher: '',
        location: '',
        onweek: 1,
        startLesson: 1,
        duration: 2,
        weeks: [],
        colorIndex: 0
      },
      weeksList: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
      visibleCourses: [],
      weeksSet: {}
  },

  onShow: function () {
    // 检查是否需要重新加载数据（数据被清除后）
    const app = getApp()
    if (app && app.globalData && app.globalData.dataCleared) {
      // 清空当前数据
      this.setData({
        wlist: [],
        visibleCourses: []
      })
      // 清除标记
      app.globalData.dataCleared = false
      // 重新加载（会读取空数据）
      this.loadCourses()
    } else {
      // 页面显示时刷新日期信息（从设置页面返回时更新周数）
      this.initDateInfo()
    }
  },

  // 初始化日期信息
  initDateInfo: function () {
    const now = new Date()
    const weekDays = this.generateWeekDays(now)
    const currentDate = this.formatDate(now)
    const currentMonth = (now.getMonth() + 1) + '月'

    const savedDate = wx.getStorageSync('semesterStartDate')
    const semesterStart = savedDate ? new Date(savedDate) : null
    const currentWeek = this.calculateWeekNumber(now, semesterStart)

    const wlist = this.data.wlist || []
    const processedCourses = this.processCourses(wlist, currentWeek)

    this.setData({
      weekDays: weekDays,
      currentDate: currentDate,
      currentMonth: currentMonth,
      currentWeek: currentWeek,
      visibleCourses: processedCourses
    })
  },

  // 处理课程显示逻辑（带缓存）
  processCourses: function (wlist, currentWeek) {
    // 使用缓存键：课程列表长度 + 当前周次
    const cacheKey = `${wlist.length}-${currentWeek}`
    if (this._coursesCache && this._coursesCache.key === cacheKey) {
      return this._coursesCache.data
    }

    const timeSlots = {}

    wlist.forEach(course => {
      const onweek = course.onweek
      const startLesson = course.startLesson
      const key = `${onweek}-${startLesson}`
      if (!timeSlots[key]) {
        timeSlots[key] = []
      }
      course.isCurrentWeek = course.weeks && course.weeks.includes(currentWeek)
      timeSlots[key].push(course)
    })

    const result = []
    Object.keys(timeSlots).forEach(key => {
      const courses = timeSlots[key]
      const hasCurrentWeek = courses.some(c => c.isCurrentWeek)

      courses.forEach(course => {
        if (hasCurrentWeek) {
          course.isVisible = course.isCurrentWeek
        } else {
          course.isVisible = true
        }
        result.push(course)
      })
    })

    // 缓存结果
    this._coursesCache = { key: cacheKey, data: result }
    return result
  },

  // 计算当前是本学期的第几周
  calculateWeekNumber: function (date, semesterStart) {
    // 如果没有设置学期开始日期，使用默认日期 2026年3月9日
    if (!semesterStart || isNaN(semesterStart.getTime())) {
      semesterStart = new Date(2026, 2, 9) // 月份从0开始，所以2月是1
    }

    const diffTime = date.getTime() - semesterStart.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const weekNumber = Math.floor(diffDays / 7) + 1
    return weekNumber > 0 ? weekNumber : 1
  },

  // 生成一周日期数据
  generateWeekDays: function (date) {
    const weekDays = []
    const weekDayNames = ['一', '二', '三', '四', '五', '六', '日']
    const currentDay = date.getDay()
    // 将周日(0)转换为7，方便计算
    const currentWeekDay = currentDay === 0 ? 7 : currentDay
    
    // 计算本周一的日期
    const monday = new Date(date)
    monday.setDate(date.getDate() - currentWeekDay + 1)

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday)
      dayDate.setDate(monday.getDate() + i)
      
      weekDays.push({
        weekDay: weekDayNames[i],
        day: dayDate.getDate(),
        isToday: this.isSameDay(dayDate, date)
      })
    }

    return weekDays
  },

  // 判断是否是同一天
  isSameDay: function (date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  },

  // 格式化日期
  formatDate: function (date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}/${month}/${day}`
  },

  // 格式化周次显示
  formatWeeks: function (weeks) {
    if (!weeks || weeks.length === 0) return ''
    if (weeks.length === 20) return '全周'

    // 简化显示连续周次
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
  },

  // 显示课程详情
  showCourseDetail: function (e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const course = this.data.wlist.find(item => item.id === id)
    if (!course) return

    if (!course.weeks) {
      course.weeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    }
    course.weeksText = this.formatWeeks(course.weeks)
    this.setData({
      showModal: true,
      modalType: 'detail',
      currentCourse: course
    })
  },

  // 显示添加课程弹窗
  showAddModal: function () {
    const weeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    const weeksSet = {}
    weeks.forEach(w => {
      weeksSet[w] = true
    })
    this.setData({
      showModal: true,
      modalType: 'add',
      formData: {
        courseName: '',
        teacher: '',
        location: '',
        onweek: 1,
        startLesson: 1,
        duration: 2,
        weeks: weeks,
        colorIndex: 0
      },
      weeksSet: weeksSet
    })
  },

  // 编辑课程
  editCourse: function () {
    const course = this.data.currentCourse
    if (!course) return

    let colorIndex = 0
    if (course.color) {
      const index = this.data.colorArrays.indexOf(course.color)
      if (index > -1) {
        colorIndex = index
      }
    }
    const weeks = [...(course.weeks || [])]
    const weeksSet = {}
    weeks.forEach(w => {
      weeksSet[w] = true
    })
    this.setData({
      modalType: 'edit',
      formData: {
        id: course.id,
        courseName: course.courseName,
        teacher: course.teacher,
        location: course.location,
        onweek: course.onweek,
        startLesson: course.startLesson,
        duration: course.duration,
        weeks: weeks,
        colorIndex: colorIndex
      },
      weeksSet: weeksSet
    })
  },

  // 删除课程
  deleteCourse: function () {
    const id = this.data.currentCourse.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这门课程吗？',
      success: (res) => {
        if (res.confirm) {
          const wlist = this.data.wlist.filter(item => item.id !== id)
          // 更新课程显示
          const visibleCourses = this.processCourses(wlist, this.data.currentWeek)
          this.setData({ wlist, visibleCourses, showModal: false })
          wx.setStorageSync('courseList', wlist)
          wx.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  },

  // 隐藏弹窗
  hideModal: function () {
    this.setData({ showModal: false })
  },

  // 表单输入
  inputChange: function (e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [`formData.${field}`]: value })
  },

  // 星期选择
  dayChange: function (e) {
    const onweek = parseInt(e.detail.value) + 1
    this.setData({ 'formData.onweek': onweek })
  },

  // 开始节次选择
  startChange: function (e) {
    const startLesson = parseInt(e.detail.value) + 1
    this.setData({ 'formData.startLesson': startLesson })
  },

  // 持续节数选择
  durationChange: function (e) {
    const duration = parseInt(e.detail.value) + 1
    this.setData({ 'formData.duration': duration })
  },

  // 切换周次选择
  toggleWeek: function (e) {
    const week = parseInt(e.currentTarget.dataset.week)
    const formData = this.data.formData
    let weeks = [...(formData.weeks || [])]
    const index = weeks.indexOf(week)

    if (index > -1) {
      weeks.splice(index, 1)
    } else {
      weeks.push(week)
      weeks.sort((a, b) => a - b)
    }

    // 创建 weeksSet 对象用于 WXML 快速查找
    const weeksSet = {}
    weeks.forEach(w => {
      weeksSet[w] = true
    })

    this.setData({
      formData: {
        ...formData,
        weeks: weeks
      },
      weeksSet: weeksSet
    })
  },

  // 选择颜色
  selectColor: function (e) {
    const index = parseInt(e.currentTarget.dataset.index)
    this.setData({ 'formData.colorIndex': index })
  },

  // 保存课程
  saveCourse: function () {
    const formData = this.data.formData

    if (!formData.courseName.trim()) {
      wx.showToast({ title: '请输入课程名称', icon: 'none' })
      return
    }

    if (formData.weeks.length === 0) {
      wx.showToast({ title: '请选择上课周次', icon: 'none' })
      return
    }

    let wlist = [...this.data.wlist]

    // 获取选中的颜色
    const selectedColor = this.data.colorArrays[formData.colorIndex]

    if (this.data.modalType === 'add') {
      // 生成新ID
      const newId = wlist.length > 0 ? Math.max(...wlist.map(item => item.id)) + 1 : 1
      wlist.push({
        id: newId,
        courseName: formData.courseName,
        teacher: formData.teacher,
        location: formData.location,
        onweek: formData.onweek,
        startLesson: formData.startLesson,
        duration: formData.duration,
        weeks: formData.weeks,
        color: selectedColor
      })
    } else if (this.data.modalType === 'edit') {
      const index = wlist.findIndex(item => item.id === formData.id)
      if (index > -1) {
        wlist[index] = { 
          id: formData.id,
          courseName: formData.courseName,
          teacher: formData.teacher,
          location: formData.location,
          onweek: formData.onweek,
          startLesson: formData.startLesson,
          duration: formData.duration,
          weeks: formData.weeks,
          color: selectedColor
        }
      }
    }

    // 更新课程显示
    const visibleCourses = this.processCourses(wlist, this.data.currentWeek)

    this.setData({ wlist, visibleCourses, showModal: false })
    wx.setStorageSync('courseList', wlist)
    wx.showToast({ title: '保存成功', icon: 'success' })
  },

  // 加载课程数据
  loadCourses: function () {
    const savedCourses = wx.getStorageSync('courseList')
    if (savedCourses && savedCourses.length > 0) {
      const courses = savedCourses.map(course => {
        if (!course.weeks || !Array.isArray(course.weeks)) {
          course.weeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        }
        if (course.xqj !== undefined) {
          course.onweek = course.xqj
          delete course.xqj
        }
        if (course.skjc !== undefined) {
          course.startLesson = course.skjc
          delete course.skjc
        }
        if (course.skcd !== undefined) {
          course.duration = course.skcd
          delete course.skcd
        }
        if (course.kcmc !== undefined) {
          course.courseName = course.kcmc
          delete course.kcmc
        }
        return course
      })
      wx.setStorageSync('courseList', courses)
      this.setData({ wlist: courses }, () => {
        this.initDateInfo()
      })
    } else {
      this.setData({ wlist: [], visibleCourses: [] })
      this.initDateInfo()
    }
  },

  onLoad: function () {
    this.loadCourses()
  }
})
