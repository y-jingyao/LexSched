// pages/settings/settings.js
Page({
  data: {
    semesterStartDate: '2025/03/09'
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

  // 设置学期开始日期
  setSemesterStart: function () {
    wx.showActionSheet({
      itemList: ['选择日期', '恢复默认'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 选择日期
          wx.showModal({
            title: '设置学期开始日期',
            editable: true,
            placeholderText: '请输入日期，如：2026/03/09',
            success: (modalRes) => {
              if (modalRes.confirm && modalRes.content) {
                this.setData({
                  semesterStartDate: modalRes.content
                })
                wx.setStorageSync('semesterStartDate', modalRes.content)
                wx.showToast({
                  title: '设置成功',
                  icon: 'success'
                })
              }
            }
          })
        } else if (res.tapIndex === 1) {
          // 恢复默认
          this.setData({
            semesterStartDate: '2026/03/09'
          })
          wx.setStorageSync('semesterStartDate', '2026/03/09')
          wx.showToast({
            title: '已恢复默认',
            icon: 'success'
          })
        }
      }
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
          wx.navigateTo({
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

  // 清除缓存
  clearCache: function () {
    wx.showModal({
      title: '提示',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage()
          wx.showToast({
            title: '清除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 关于
  about: function () {
    wx.showModal({
      title: '关于 课程表',
      content: 'Copyright © 2026 - now yanghx. All Rights Reserved. \n鲁ICP备2025168409号\n\n版本：v0.0.1 \n\n至于为什么叫AssetPulse你别管\n\n后期会对教务系统进行适配，也可能会做成app',
      showCancel: false
    })
  }
})
