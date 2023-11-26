import Axios from 'axios'
import service from '../service'

// eslint-disable-next-line no-unused-vars
// import { MessageBox, Message } from 'element-ui'
// import select from 'element-ui/packages/select'

// 获取节点（分页、可搜索）
export function getPoint(params) {
  return service({
    url: '/node/all',
    method: 'get',
    params
  })
}

// 开启或关闭开关
export function pointControlChange(params) {
  return service({
    url: '/node/on-off',
    method: 'get',
    params
  })
}

// 获取当前模式
// true 表示自动模式，false 表示手动模式
export async function getCurrentMode() {
  return service.get('/control/mode/current')
}

// 设置当前模式
// true 表示自动模式，false 表示手动模式
export async function setCurrentMode(mode) {
  return service.post('/control/mode/current', { mode })
}

// 导出表格
export async function getExcel(startDate, endDate, selectPoints) {
  try {
    //因为后段这里直接返回了二进制数据，server.js 配置 无法直接返回数据，所以这里直接用axios了
    const response = await Axios({
      url: process.env.VUE_APP_BASE_API + '/history/excel',
      method: 'get',
      responseType: 'blob',
      params: {
        startDate,
        endDate,
        selectPoints: selectPoints + ''
      }
    })

    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = 'history.xlsx' // 下载的文件名
    link.click()
  } catch (error) {
    console.error('Error while downloading Excel:', error)
    console.log('Error response data:', error.response && error.response.data)
  }
}

// 删除节点
export function deletePoint(nodeNumber) {
  return service({
    url: `/node/delete/${nodeNumber}`,
    method: 'delete'
  })
}

