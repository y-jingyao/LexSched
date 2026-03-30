//index.js
const dateUtil = require('../../utils/dateUtil')
const formatUtil = require('../../utils/formatUtil')
const courseService = require('../../services/courseService')

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
    weeksSet: {}
  },

  onShow() {
    const app = getApp()
    if (app?.globalData?.dataCleared) {
      this.setData({ wlist: [], visibleCourses: [] })
      app.globalData.dataCleared = false
      this.loadCourses()
    } else {
      this.initDateInfo()
    }
  },

  onLoad() {
    this.loadCourses()
  },

  initDateInfo() {
    const now = new Date()
    const semesterStart = dateUtil.getSemesterStartDate()
    const currentWeek = dateUtil.calculateWeekNumber(now, semesterStart)

    const wlist = this.data.wlist || []
    const visibleCourses = courseService.processCoursesForDisplay(wlist, currentWeek, this._coursesCache)
    this._coursesCache = { key: `${wlist.length}-${currentWeek}`, data: visibleCourses }

    this.setData({
      weekDays: dateUtil.generateWeekDays(now),
      currentDate: dateUtil.formatDate(now),
      currentMonth: `${now.getMonth() + 1}月`,
      currentWeek,
      visibleCourses
    })
  },

  loadCourses() {
    const courses = courseService.getAllCourses()
    this.setData({ wlist: courses }, () => {
      this.initDateInfo()
    })
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
          const visibleCourses = courseService.processCoursesForDisplay(wlist, this.data.currentWeek, this._coursesCache)
          this._coursesCache = { key: `${wlist.length}-${this.data.currentWeek}`, data: visibleCourses }
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
    const visibleCourses = courseService.processCoursesForDisplay(wlist, this.data.currentWeek, this._coursesCache)
    this._coursesCache = { key: `${wlist.length}-${this.data.currentWeek}`, data: visibleCourses }

    this.setData({ wlist, visibleCourses, showModal: false })
    wx.showToast({ title: '保存成功', icon: 'success' })
  }
})
