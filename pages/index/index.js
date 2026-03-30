//index.js
const dateUtil = require('../../utils/dateUtil')
const formatUtil = require('../../utils/formatUtil')
const courseService = require('../../services/courseService')

Page({
  data: {
    colorArrays: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE"],
    weekDays: [],
    currentDate: '',
    displayWeek: 1,
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
    wlist: [],
    showModal: false,
    modalType: '',
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
    weeksList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    visibleCourses: [],
    weeksSet: {},
    touchStartX: 0,
    touchStartY: 0,
    isAnimating: false,
    slideOffset: 0
  },

  onShow() {
    const app = getApp()
    if (app?.globalData?.dataCleared) {
      this.setData({ wlist: [], visibleCourses: [] })
      app.globalData.dataCleared = false
      this.loadCourses()
    } else if (app?.globalData?.showAddModal) {
      // 从设置页跳转过来，需要显示添加课程弹窗
      app.globalData.showAddModal = false
      this.loadCourses()
      this.showAddModal()
    } else {
      this.initDateInfo()
    }
  },

  onLoad() {
    this.loadCourses()
  },

  initDateInfo() {
    const now = new Date()
    let semesterStart = dateUtil.getSemesterStartDate()
    if (!semesterStart || isNaN(semesterStart.getTime())) {
      semesterStart = new Date(2026, 2, 9)
    }
    const currentWeek = dateUtil.calculateWeekNumber(now, semesterStart)
    // 打开时默认显示本周
    const displayWeek = currentWeek

    const wlist = this.data.wlist || []
    const visibleCourses = courseService.processCoursesForDisplay(wlist, displayWeek, this._coursesCache)
    this._coursesCache = { key: `${wlist.length}-${displayWeek}`, data: visibleCourses }

    const weekDays = dateUtil.generateWeekDaysByNumber(displayWeek, semesterStart, now)
    const mondayDate = new Date(semesterStart)
    mondayDate.setDate(semesterStart.getDate() + (displayWeek - 1) * 7)

    this.setData({
      weekDays,
      currentDate: dateUtil.formatDate(now),
      currentMonth: `${mondayDate.getMonth() + 1}月`,
      displayWeek,
      visibleCourses
    })
  },

  loadCourses() {
    const courses = courseService.getAllCourses()
    this.setData({ wlist: courses }, () => {
      this.initDateInfo()
    })
  },

  touchStart(e) {
    if (this.data.isAnimating) return
    this.setData({
      touchStartX: e.touches[0].pageX,
      touchStartY: e.touches[0].pageY,
      slideOffset: 0
    })
  },

  touchMove(e) {
    if (this.data.isAnimating) return
    
    const moveX = e.touches[0].pageX
    const moveY = e.touches[0].pageY
    const deltaX = moveX - this.data.touchStartX
    const deltaY = moveY - this.data.touchStartY
    
    // 只有水平滑动才响应，并阻止默认行为防止页面整体滑动
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 阻止默认行为，防止页面整体被拉动
      // #ifdef H5
      e.preventDefault()
      // #endif
      
      // 限制滑动距离
      const maxOffset = 150
      const offset = Math.max(-maxOffset, Math.min(maxOffset, deltaX))
      this.setData({ slideOffset: offset })
    }
  },

  touchEnd(e) {
    if (this.data.isAnimating) return
    
    const endX = e.changedTouches[0].pageX
    const endY = e.changedTouches[0].pageY
    const deltaX = endX - this.data.touchStartX
    const deltaY = endY - this.data.touchStartY
    const minSwipeDistance = 50

    // 只有水平滑动才响应
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) >= minSwipeDistance) {
        if (deltaX > 0) {
          this.prevWeek()
        } else {
          this.nextWeek()
        }
      } else {
        // 滑动距离不够，回弹
        this.setData({ slideOffset: 0 })
      }
    } else {
      this.setData({ slideOffset: 0 })
    }
  },

  prevWeek() {
    const newWeek = Math.max(1, this.data.displayWeek - 1)
    if (newWeek !== this.data.displayWeek) {
      this.switchToWeek(newWeek, 'right')
    } else {
      this.setData({ slideOffset: 0 })
    }
  },

  nextWeek() {
    const newWeek = Math.min(20, this.data.displayWeek + 1)
    if (newWeek !== this.data.displayWeek) {
      this.switchToWeek(newWeek, 'left')
    } else {
      this.setData({ slideOffset: 0 })
    }
  },

  switchToWeek(week, direction) {
    this.setData({ isAnimating: true })
    
    const wlist = this.data.wlist
    let semesterStart = dateUtil.getSemesterStartDate()
    if (!semesterStart || isNaN(semesterStart.getTime())) {
      semesterStart = new Date(2026, 2, 9)
    }
    const now = new Date()
    
    // 预加载新数据
    const visibleCourses = courseService.processCoursesForDisplay(wlist, week, this._coursesCache)
    this._coursesCache = { key: `${wlist.length}-${week}`, data: visibleCourses }

    // 生成新周的日期
    const weekDays = dateUtil.generateWeekDaysByNumber(week, semesterStart, now)
    const mondayDate = new Date(semesterStart)
    mondayDate.setDate(semesterStart.getDate() + (week - 1) * 7)

    // 第一阶段：滑动到边缘
    const slideOutOffset = direction === 'left' ? -150 : 150
    this.setData({ slideOffset: slideOutOffset })

    // 第二阶段：切换数据并滑回
    setTimeout(() => {
      this.setData({
        displayWeek: week,
        visibleCourses,
        weekDays,
        currentMonth: `${mondayDate.getMonth() + 1}月`,
        slideOffset: direction === 'left' ? 150 : -150
      })

      // 第三阶段：平滑回到原位
      setTimeout(() => {
        this.setData({
          slideOffset: 0,
          isAnimating: false
        })
      }, 50)
    }, 200)
  },

  showCourseDetail(e) {
    const id = parseInt(e.currentTarget.dataset.id)
    const course = this.data.wlist.find(item => item.id === id)
    if (!course) return

    if (!course.weeks) {
      course.weeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    }
    course.weeksText = formatUtil.formatWeeks(course.weeks)

    this.setData({
      showModal: true,
      modalType: 'detail',
      currentCourse: course
    })
  },

  showAddModal() {
    const weeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
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
      weeksSet: formatUtil.weeksToSet(weeks)
    })
  },

  editCourse() {
    const course = this.data.currentCourse
    if (!course) return

    let colorIndex = 0
    if (course.color) {
      const index = this.data.colorArrays.indexOf(course.color)
      if (index > -1) colorIndex = index
    }

    const weeks = [...(course.weeks || [])]
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
      weeksSet: formatUtil.weeksToSet(weeks)
    })
  },

  deleteCourse() {
    const id = this.data.currentCourse.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这门课程吗？',
      success: (res) => {
        if (res.confirm) {
          courseService.deleteCourse(id)
          const wlist = courseService.getAllCourses()
          const visibleCourses = courseService.processCoursesForDisplay(wlist, this.data.displayWeek, this._coursesCache)
          this._coursesCache = { key: `${wlist.length}-${this.data.displayWeek}`, data: visibleCourses }
          this.setData({ wlist, visibleCourses, showModal: false })
          wx.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    })
  },

  hideModal() {
    this.setData({ showModal: false })
  },

  inputChange(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [`formData.${field}`]: value })
  },

  dayChange(e) {
    this.setData({ 'formData.onweek': parseInt(e.detail.value) + 1 })
  },

  startChange(e) {
    this.setData({ 'formData.startLesson': parseInt(e.detail.value) + 1 })
  },

  durationChange(e) {
    this.setData({ 'formData.duration': parseInt(e.detail.value) + 1 })
  },

  toggleWeek(e) {
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

    this.setData({
      formData: { ...formData, weeks },
      weeksSet: formatUtil.weeksToSet(weeks)
    })
  },

  selectColor(e) {
    this.setData({ 'formData.colorIndex': parseInt(e.currentTarget.dataset.index) })
  },

  saveCourse() {
    const formData = this.data.formData

    if (!formData.courseName.trim()) {
      wx.showToast({ title: '请输入课程名称', icon: 'none' })
      return
    }

    if (formData.weeks.length === 0) {
      wx.showToast({ title: '请选择上课周次', icon: 'none' })
      return
    }

    const selectedColor = this.data.colorArrays[formData.colorIndex]
    const courseData = {
      courseName: formData.courseName,
      teacher: formData.teacher,
      location: formData.location,
      onweek: formData.onweek,
      startLesson: formData.startLesson,
      duration: formData.duration,
      weeks: formData.weeks,
      color: selectedColor
    }

    if (this.data.modalType === 'add') {
      courseService.addCourse(courseData)
    } else if (this.data.modalType === 'edit') {
      courseService.updateCourse({ ...courseData, id: formData.id })
    }

    const wlist = courseService.getAllCourses()
    const visibleCourses = courseService.processCoursesForDisplay(wlist, this.data.displayWeek, this._coursesCache)
    this._coursesCache = { key: `${wlist.length}-${this.data.displayWeek}`, data: visibleCourses }

    this.setData({ wlist, visibleCourses, showModal: false })
    wx.showToast({ title: '保存成功', icon: 'success' })
  }
})
