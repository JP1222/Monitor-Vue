import service from '../service'

// 全局变量，用于追踪定时器状态
// eslint-disable-next-line no-unused-vars
const timerRunning = false

// 获取所有节点
export async function getNodes() {
  return service.get('/node/nodes')
}

// 查找
export async function findNode(nodeNumber) {
  return service.get(`/node/${nodeNumber}`)
}

// 添加节点
export async function addNode(nodeNumber) {
  return service.post('/node/nodes', { nodeNumber })
}

// 删除节点
export async function deleteNode(nodeNumber) {
  return service.delete(`/node/delete/${nodeNumber}`)
}

// 控制继电器
export async function controlRelay(data) {
  const { nodeNumber, relayNumber, control } = data
  return service.put(`/node/nodes/${nodeNumber}/relays/${relayNumber}`, { control }, {
    timeout: 10000
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
