// pages/settings/settings.js
const pdfParser = require('../../utils/pdfParser')
const courseService = require('../../services/courseService')

Page({
  data: {
    semesterStartDate: '2026/03/09',
    showImportModal: false,
    importText: '',
    importType: '', // 'pdf' 或 'text'
    parsedCourses: [],
    isParsing: false,
    // 课表设置
    showScheduleSettingsModal: false,
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
    editingTimeIndex: -1,
    editTimeForm: {
      start: '',
      end: ''
    },
    // 编辑相关
    showEditModal: false,
    editingCourse: null,
    editingIndex: -1,
    editForm: {
      courseName: '',
      teacher: '',
      location: '',
      onweek: 1,
      startLesson: 1,
      duration: 2,
      weeks: []
    },
    weeksList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    dayList: [
      { value: 1, label: '星期一' },
      { value: 2, label: '星期二' },
      { value: 3, label: '星期三' },
      { value: 4, label: '星期四' },
      { value: 5, label: '星期五' },
      { value: 6, label: '星期六' },
      { value: 7, label: '星期日' }
    ],
    lessonList: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  },

  onLoad: function (options) {
    // 从本地存储读取学期开始日期
    const savedDate = wx.getStorageSync('semesterStartDate')
    if (savedDate) {
      this.setData({
        semesterStartDate: savedDate
      })
    }
    
    // 从本地存储读取课程时间设置
    const savedTimeList = wx.getStorageSync('timeList')
    if (savedTimeList && Array.isArray(savedTimeList) && savedTimeList.length > 0) {
      this.setData({
        timeList: savedTimeList
      })
    }
  },

  // 显示课程时间设置弹窗
  showScheduleSettings: function () {
    this.setData({
      showScheduleSettingsModal: true
    })
  },

  // 隐藏课程时间设置弹窗
  hideScheduleSettingsModal: function () {
    this.setData({
      showScheduleSettingsModal: false,
      editingTimeIndex: -1
    })
  },

  // 添加一节课
  addLesson: function () {
    const { timeList } = this.data
    if (timeList.length >= 12) {
      wx.showToast({
        title: '最多12节课',
        icon: 'none'
      })
      return
    }
    
    // 默认新节课时间为上一节课结束后1小时
    let newStart = "08:00"
    let newEnd = "08:50"
    
    if (timeList.length > 0) {
      const lastLesson = timeList[timeList.length - 1]
      const lastEndHour = parseInt(lastLesson.end.split(':')[0])
      const lastEndMin = parseInt(lastLesson.end.split(':')[1])
      
      // 下一节课开始时间为上一节结束后10分钟
      let nextStartMin = lastEndMin + 10
      let nextStartHour = lastEndHour
      if (nextStartMin >= 60) {
        nextStartMin -= 60
        nextStartHour += 1
      }
      
      // 一节课50分钟
      let nextEndMin = nextStartMin + 50
      let nextEndHour = nextStartHour
      if (nextEndMin >= 60) {
        nextEndMin -= 60
        nextEndHour += 1
      }
      
      newStart = `${String(nextStartHour).padStart(2, '0')}:${String(nextStartMin).padStart(2, '0')}`
      newEnd = `${String(nextEndHour).padStart(2, '0')}:${String(nextEndMin).padStart(2, '0')}`
    }
    
    const newTimeList = [...timeList, { start: newStart, end: newEnd }]
    this.setData({
      timeList: newTimeList
    })
    this.saveTimeList(newTimeList)
  },

  // 删除一节课
  removeLesson: function (e) {
    const index = e.currentTarget.dataset.index
    const { timeList } = this.data
    
    if (timeList.length <= 1) {
      wx.showToast({
        title: '至少保留1节课',
        icon: 'none'
      })
      return
    }
    
    const newTimeList = timeList.filter((_, i) => i !== index)
    this.setData({
      timeList: newTimeList
    })
    this.saveTimeList(newTimeList)
  },

  // 开始编辑课程时间
  editLessonTime: function (e) {
    const index = e.currentTarget.dataset.index
    const lesson = this.data.timeList[index]
    this.setData({
      editingTimeIndex: index,
      editTimeForm: {
        start: lesson.start,
        end: lesson.end
      }
    })
  },

  // 取消编辑课程时间
  cancelEditTime: function () {
    this.setData({
      editingTimeIndex: -1,
      editTimeForm: {
        start: '',
        end: ''
      }
    })
  },

  // 保存课程时间编辑
  saveLessonTime: function () {
    const { editingTimeIndex, editTimeForm, timeList } = this.data
    
    if (!editTimeForm.start || !editTimeForm.end) {
      wx.showToast({
        title: '请填写完整时间',
        icon: 'none'
      })
      return
    }
    
    const newTimeList = [...timeList]
    newTimeList[editingTimeIndex] = {
      start: editTimeForm.start,
      end: editTimeForm.end
    }
    
    this.setData({
      timeList: newTimeList,
      editingTimeIndex: -1
    })
    this.saveTimeList(newTimeList)
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  },

  // 课程时间输入变化
  onTimeInputChange: function (e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`editTimeForm.${field}`]: e.detail.value
    })
  },

  // 保存课程时间列表
  saveTimeList: function (timeList) {
    wx.setStorageSync('timeList', timeList)
  },

  // 日期选择器变化
  onDateChange: function (e) {
    const selectedDate = e.detail.value
    this.setData({
      semesterStartDate: selectedDate
    })
    wx.setStorageSync('semesterStartDate', selectedDate)
    wx.showToast({
      title: '设置成功',
      icon: 'success'
    })
  },

  // 导入课程表
  importSchedule: function () {
    wx.showActionSheet({
      itemList: ['从教务系统导入', '手动添加课程', '从文件导入'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          })
        } else if (res.tapIndex === 1) {
          // 跳转到首页并触发添加课程
          const app = getApp()
          if (app) {
            app.globalData = app.globalData || {}
            app.globalData.showAddModal = true
          }
          wx.switchTab({
            url: '/pages/index/index'
          })
        } else if (res.tapIndex === 2) {
          // 从文件导入
          this.showImportOptions()
        }
      }
    })
  },

  // 显示导入选项
  showImportOptions: function () {
    wx.showActionSheet({
      itemList: ['选择PDF文件', '粘贴课表文本'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.selectPDFFile()
        } else if (res.tapIndex === 1) {
          this.showTextImportModal()
        }
      }
    })
  },

  // 选择PDF文件
  selectPDFFile: function () {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const file = res.tempFiles[0]
        this.handlePDFFile(file)
      },
      fail: (err) => {
        console.error('选择文件失败:', err)
        wx.showToast({
          title: '选择文件失败',
          icon: 'none'
        })
      }
    })
  },

  // 处理PDF文件
  handlePDFFile: function (file) {
    wx.showLoading({
      title: '正在解析...',
      mask: true
    })

    // 由于微信小程序无法直接解析PDF，有两种方案：
    // 1. 提示用户手动复制PDF内容粘贴 目前使用这种
    // 2. 上传到服务器解析（需要配置服务器）

    wx.hideLoading()

    wx.showModal({
      title: 'PDF解析提示',
      content: '由于微信小程序限制，无法直接解析PDF文件。请打开PDF文件，复制其中的课表内容，然后选择"粘贴课表文本"方式导入。',
      confirmText: '去粘贴',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.showTextImportModal()
        }
      }
    })
  },

  // 显示文本导入弹窗
  showTextImportModal: function () {
    this.setData({
      showImportModal: true,
      importType: 'text',
      importText: '',
      parsedCourses: []
    })
  },

  // 隐藏导入弹窗
  hideImportModal: function () {
    this.setData({
      showImportModal: false,
      importText: '',
      parsedCourses: [],
      isParsing: false
    })
  },

  // 输入框内容变化
  onImportTextChange: function (e) {
    this.setData({
      importText: e.detail.value
    })
  },

  // 解析课表文本
  parseImportText: function () {
    const text = this.data.importText.trim()
    if (!text) {
      wx.showToast({
        title: '请输入课表内容',
        icon: 'none'
      })
      return
    }

    this.setData({ isParsing: true })

    // 使用pdfParser解析文本
    const courses = pdfParser.parseManualInput(text)

    this.setData({
      parsedCourses: courses,
      isParsing: false
    })

    if (courses.length === 0) {
      wx.showModal({
        title: '未识别到课程',
        content: '未能从输入内容中识别出课程信息。请确保格式正确，例如：\n\n高等数学 张三 教学楼A101 1-16周 星期一 1-2节。给您带来的不便敬请谅解。',
        showCancel: false
      })
    }
  },

  // 确认导入课程
  confirmImport: function () {
    const courses = this.data.parsedCourses
    if (courses.length === 0) {
      wx.showToast({
        title: '没有可导入的课程',
        icon: 'none'
      })
      return
    }

    // 导入所有课程
    let successCount = 0
    courses.forEach(course => {
      try {
        courseService.addCourse(course)
        successCount++
      } catch (e) {
        console.error('导入课程失败:', e)
      }
    })

    this.hideImportModal()

    wx.showToast({
      title: `成功导入${successCount}门课程`,
      icon: 'success'
    })

    // 通知首页刷新
    const app = getApp()
    if (app) {
      app.globalData = app.globalData || {}
      app.globalData.dataUpdated = true
    }
  },

  // 删除解析出的某个课程
  removeParsedCourse: function (e) {
    const index = e.currentTarget.dataset.index
    const courses = this.data.parsedCourses
    courses.splice(index, 1)
    this.setData({
      parsedCourses: courses
    })
  },

  // 编辑解析出的课程
  editParsedCourse: function (e) {
    const index = e.currentTarget.dataset.index
    const course = this.data.parsedCourses[index]

    this.setData({
      showEditModal: true,
      editingCourse: course,
      editingIndex: index,
      editForm: {
        courseName: course.courseName,
        teacher: course.teacher,
        location: course.location,
        onweek: course.onweek,
        startLesson: course.startLesson,
        duration: course.duration,
        weeks: course.weeks || []
      }
    })
  },

  // 隐藏编辑弹窗
  hideEditModal: function () {
    this.setData({
      showEditModal: false,
      editingCourse: null,
      editingIndex: -1,
      editForm: {
        courseName: '',
        teacher: '',
        location: '',
        onweek: 1,
        startLesson: 1,
        duration: 2,
        weeks: []
      }
    })
  },

  // 编辑表单输入变化
  onEditInputChange: function (e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`editForm.${field}`]: value
    })
  },

  // 编辑表单选择器变化
  onEditPickerChange: function (e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`editForm.${field}`]: parseInt(value) + 1
    })
  },

  // 周次选择变化
  onWeeksChange: function (e) {
    const selectedWeeks = e.detail.value.map(i => parseInt(i) + 1)
    this.setData({
      'editForm.weeks': selectedWeeks
    })
  },

  // 保存编辑的课程
  saveEditedCourse: function () {
    const { editForm, editingIndex, parsedCourses } = this.data

    // 验证必填字段
    if (!editForm.courseName.trim()) {
      wx.showToast({
        title: '请输入课程名称',
        icon: 'none'
      })
      return
    }

    // 更新课程数据
    const updatedCourse = {
      ...parsedCourses[editingIndex],
      courseName: editForm.courseName.trim(),
      teacher: editForm.teacher.trim(),
      location: editForm.location.trim(),
      onweek: parseInt(editForm.onweek),
      startLesson: parseInt(editForm.startLesson),
      duration: parseInt(editForm.duration),
      weeks: editForm.weeks.length > 0 ? editForm.weeks : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    }

    parsedCourses[editingIndex] = updatedCourse

    this.setData({
      parsedCourses: parsedCourses
    })

    this.hideEditModal()

    wx.showToast({
      title: '修改成功',
      icon: 'success'
    })
  },

  // 阻止冒泡
  preventBubble: function () {
    // 什么都不做，只是阻止事件冒泡
  },

  // 清除所有数据
  clearCache: function () {
    wx.showModal({
      title: '警告',
      content: '此操作将删除所有课程数据和设置，且无法恢复。确定要继续吗？',
      confirmColor: '#f5576c',
      success: (res) => {
        if (res.confirm) {
          // 二次确认
          wx.showModal({
            title: '最终确认',
            content: '再次确认：删除所有数据后无法恢复，是否继续？',
            confirmText: '确认删除',
            confirmColor: '#f5576c',
            success: (confirmRes) => {
              if (confirmRes.confirm) {
                // 使用异步方式清除存储
                wx.clearStorage({
                  success: () => {
                    // 重置页面数据
                    this.setData({
                      semesterStartDate: '2026/03/09'
                    })
                    // 通知课表页面数据已清除
                    const app = getApp()
                    if (app) {
                      app.globalData = app.globalData || {}
                      app.globalData.dataCleared = true
                    }
                    wx.showToast({
                      title: '已清除所有数据',
                      icon: 'success'
                    })
                  },
                  fail: () => {
                    wx.showToast({
                      title: '清除失败',
                      icon: 'none'
                    })
                  }
                })
              }
            }
          })
        }
      }
    })
  },

  // 关于
  about: function () {
    wx.showModal({
      title: '关于 LexSched课程表',
      content: '版本：v0.1.1 \n2026年4月9日更新\n\n因微信小程序限制过多，后期会做成app，敬请期待',
      showCancel: false
    })
  }
})
