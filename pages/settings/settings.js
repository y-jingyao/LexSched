// pages/settings/settings.js
Page({
  data: {
    semesterStartDate: '2026/03/09'
  },

  onLoad: function (options) {
    // 从本地存储读取学期开始日期
    const savedDate = wx.getStorageSync('semesterStartDate')
    if (savedDate) {
      this.setData({
        semesterStartDate: savedDate
      })
    }
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
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          })
        }
      }
    })
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
      content: 'Copyright © 2026 - now yanghx. All Rights Reserved. \n\n版本：v0.0.1 \n\n后期会对教务系统进行适配，也可能会做成app',
      showCancel: false
    })
  }
})
