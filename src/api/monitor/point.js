import Axios from 'axios'
import service from '../service'

import { MessageBox, Message } from 'element-ui'

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
export async function getExcel(startDate, endDate) {
  try {
    const response = await Axios({
      url: "http://47.114.81.63:8081/history/excel",
      method: "GET",
      responseType: 'blob',
      params: {
        startDate: startDate,
        endDate: endDate
      }
    });

    // 将 response.data 转换为 Blob 对象
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "history.xlsx"; // 下载的文件名
    link.click();
  } catch (error) {
    console.error("Error while downloading Excel:", error);
    console.log("Error response data:", error.response && error.response.data);
  }
}

