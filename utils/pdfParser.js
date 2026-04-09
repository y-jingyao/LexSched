// PDF课表解析工具
// 适配济南大学教务系统课表格式

/**
 * 从PDF文本内容解析课表
 * @param {string} text - PDF提取的文本内容
 * @returns {Array} 解析后的课程列表
 */
function parseScheduleFromText(text) {
  const courses = []
  const seenCourses = new Set()

  // 首先预处理文本：合并被拆分的行，并标记每行属于哪个星期
  const processedLines = preprocessText(text)

  for (const lineInfo of processedLines) {
    const { line, dayOfWeek } = lineInfo

    if (!line || dayOfWeek === 0) continue

    // 尝试解析课程行
    const course = parseCourseLine(line, dayOfWeek)

    if (course) {
      const key = `${course.courseName}-${course.onweek}-${course.startLesson}-${course.weeks.join(',')}`
      if (!seenCourses.has(key)) {
        seenCourses.add(key)
        courses.push(course)
      }
    }
  }

  return courses
}

/**
 * 预处理文本，合并被拆分的行，并确定每行属于哪个星期
 * 处理 kebiao.txt 格式：
 * - 节次和课程可能在不同行
 * - 同一节次可能有多门课程（连堂）
 * - 有些课程行没有节次前缀，需要继承上一行的节次
 * - 课程信息可能被拆分到多行（如"教学班组"跨行）
 * - 多行课程信息需要合并
 */
function preprocessText(text) {
  // 首先合并被拆分的课程行（如"教学班组"跨行的情况）
  let mergedText = text
    // 合并 "教学班组" 跨行
    .replace(/教学班组\r?\n成:/g, '教学班组成:')
    // 合并 "课程学时" 跨行
    .replace(/课程学时\r?\n时组成:/g, '课程学时组成:')
    .replace(/课程学\r?\n时组成:/g, '课程学时组成:')
    // 合并 "选课备注" 跨行
    .replace(/选课备注\r?\n:\//g, '选课备注:/')
    .replace(/选课备注\r?\n\//g, '选课备注:/')
    // 合并 "学分" 跨行
    .replace(/学分:\r?\n([\d.]+)/g, '学分:$1')
  
  const rawLines = mergedText.split(/\r?\n/).map(line => line.trim()).filter(line => line)
  const result = []

  // 星期匹配模式
  const dayPattern = /^星期([一二三四五六日])$/

  // 处理每一行，确定它属于哪个星期
  let currentDayOfWeek = 0
  let lastTimeSlot = null // 上一个节次

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]

    // 检查是否是星期行
    const dayMatch = line.match(dayPattern)
    if (dayMatch) {
      currentDayOfWeek = parseDayOfWeek(dayMatch[1])
      lastTimeSlot = null
      continue
    }

    // 跳过页脚信息
    if (line.includes('打印时间:') || line.includes('实践课程：') || line.includes('■: 实践') || line.startsWith('■:')) {
      continue
    }

    // 如果不是星期行，且有当前星期，则处理这一行
    if (currentDayOfWeek > 0) {
      // 检查是否是纯节次行（如"7-8"、"3-4"、"9-10"）
      const timeMatch = line.match(/^(\d+-\d+)$/)
      if (timeMatch) {
        // 纯节次行，暂存等待下一行
        lastTimeSlot = line
        continue
      }

      // 检查是否是课程行（包含★或周数:）
      if (line.includes('★') && line.includes('周数:')) {
        // 检查课程行是否自带节次
        const hasTimeSlot = /^\d+-\d+/.test(line)
        
        if (hasTimeSlot) {
          // 课程行自带节次信息
          const timeSlotMatch = line.match(/^(\d+-\d+)/)
          if (timeSlotMatch) {
            lastTimeSlot = timeSlotMatch[1]
          }
          result.push({
            line: line,
            dayOfWeek: currentDayOfWeek
          })
        } else if (lastTimeSlot) {
          // 课程行没有节次，使用上一个节次
          result.push({
            line: lastTimeSlot + ' ' + line,
            dayOfWeek: currentDayOfWeek
          })
        }
      }
    }
  }

  return result
}

/**
 * 解析单行课程信息
 * 格式: 节次 课程名★ 周数: xxx/...
 * 支持: 1-2, 3-4, 5-6, 7-8, 9-10, 1-2(单), 3-4(双)等
 */
function parseCourseLine(line, dayOfWeek) {
  // 匹配节次 + 课程名 + 周数信息
  // 节次格式: 1-2, 3-4, 5-6, 7-8, 9-10, 1-2(单), 3-4(双)等
  const pattern = /^(\d+)-(\d+)(?:\((单|双)\))?\s+(.+?)★\s+周数[:：]\s*([^/]+)/

  const match = line.match(pattern)
  if (!match) {
    console.log('解析失败:', line.substring(0, 50))
    return null
  }

  const startLesson = parseInt(match[1])
  const endLesson = parseInt(match[2])
  const weekType = match[3] || '' // 单或双
  const courseName = match[4].trim()
  const weekStr = match[5].trim()

  // 解析周次
  let weeks = parseComplexWeeks(weekStr)

  // 处理单双周
  if (weekType === '单') {
    weeks = weeks.filter(w => w % 2 === 1)
  } else if (weekType === '双') {
    weeks = weeks.filter(w => w % 2 === 0)
  }

  if (weeks.length === 0 || dayOfWeek === 0) return null

  // 提取其他信息
  const location = extractLocation(line) || '未排地点'
  const teacher = extractTeacher(line) || '未知教师'

  return {
    courseName: courseName,
    teacher: teacher,
    location: location,
    weeks: weeks,
    onweek: dayOfWeek,
    startLesson: startLesson,
    duration: endLesson - startLesson + 1,
    colorIndex: Math.floor(Math.random() * 20)
  }
}

/**
 * 解析复杂周次格式
 * 支持格式:
 * - 1-15周
 * - 1-5周,7-9周,11-14周
 * - 2-4周(双),8周,12-14周(双)
 * - 1-15周(单)
 * - 6周,10周
 * - 2-4周(双),8周,12-14周(双)
 * - 1-12周
 */
function parseComplexWeeks(weekStr) {
  const weeks = []

  // 移除"周"字
  const cleanStr = weekStr.replace(/周/g, '').trim()

  // 按逗号分割多个周次范围
  const parts = cleanStr.split(',').map(s => s.trim())

  for (const part of parts) {
    // 匹配范围格式: 1-15, 2-4(双), 1-15(单), 1-5
    const rangeMatch = part.match(/(\d+)-(\d+)(?:\((单|双)\))?/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1])
      const end = parseInt(rangeMatch[2])
      const type = rangeMatch[3] || ''

      for (let i = start; i <= end; i++) {
        if (type === '单' && i % 2 === 0) continue
        if (type === '双' && i % 2 === 1) continue
        weeks.push(i)
      }
    } else {
      // 单一周次: 6, 10, 8
      const singleWeek = parseInt(part)
      if (!isNaN(singleWeek)) {
        weeks.push(singleWeek)
      }
    }
  }

  return [...new Set(weeks)].sort((a, b) => a - b)
}

/**
 * 从行中提取地点
 * 格式: /地点: 10J417/, /地点: 未排地点/
 */
function extractLocation(line) {
  const match = line.match(/地点[:：]\s*([^/]+)/)
  if (match) {
    return match[1].trim()
  }
  return null
}

/**
 * 从行中提取教师
 * 格式: /教师: 孔祥玉/, /教师: 张坤,潘岳,曹毅,马坤/
 */
function extractTeacher(line) {
  const match = line.match(/教师[:：]\s*([^/]+)/)
  if (match) {
    return match[1].trim()
  }
  return null
}

/**
 * 解析星期
 * @param {string} dayStr - 如 "一" 或 "1"
 * @returns {number} 1-7
 */
function parseDayOfWeek(dayStr) {
  const dayMap = {
    '一': 1, '1': 1,
    '二': 2, '2': 2,
    '三': 3, '3': 3,
    '四': 4, '4': 4,
    '五': 5, '5': 5,
    '六': 6, '6': 6,
    '日': 7, '天': 7, '7': 7
  }
  return dayMap[dayStr] || 0
}

/**
 * 手动输入/粘贴课表文本解析
 * @param {string} text - 用户输入的课表文本
 * @returns {Array} 解析后的课程列表
 */
function parseManualInput(text) {
  return parseScheduleFromText(text)
}

/**
 * 上传PDF到服务器解析
 * @param {string} filePath - PDF文件路径
 * @param {string} serverUrl - 服务器地址
 * @returns {Promise<Array>} 解析后的课程列表
 */
async function uploadAndParsePDF(filePath, serverUrl) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: serverUrl,
      filePath: filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.courses) {
            resolve(data.courses)
          } else if (data.text) {
            const courses = parseScheduleFromText(data.text)
            resolve(courses)
          } else {
            resolve([])
          }
        } catch (e) {
          reject(new Error('解析响应失败'))
        }
      },
      fail: reject
    })
  })
}

module.exports = {
  parseScheduleFromText,
  parseManualInput,
  uploadAndParsePDF,
  parseComplexWeeks,
  parseDayOfWeek
}
