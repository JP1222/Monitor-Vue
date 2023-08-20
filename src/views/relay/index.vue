<template>
  <div>
    <el-card padding="20px">
      <div class="top-form-contianer">
        <!-- Element UI的Form组件，用于收集用户输入 -->
        <el-form ref="form" :model="paramsList">
          <el-row :gutter="20">
            <!-- 节点编号输入框 -->
            <el-col :span="8" :xs="24">
              <el-form-item label="节点编号">
                <el-input v-model="paramsList.nodeNumber" clearable>
                  <!-- 添加节点按钮，点击后调用addNode方法 -->
                  <template #append>
                    <el-button :loading="addingNode" type="primary" :disabled="autoMode" @click="addNode">添加节点</el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <!-- 查找节点输入框 -->
            <el-col :span="8" :xs="24">
              <el-form-item label="查找节点">
                <el-input v-model="paramsList.searchNode" clearable>
                  <!-- 查找节点按钮，点击后调用findNode方法 -->
                  <template #append>
                    <el-button :loading="findingNode" type="primary" @click="findNode">查找节点</el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8" :xs="24">
              <el-form-item>
                <el-button class="findall" type="primary" @click="getNodes">显示全部节点</el-button>
              </el-form-item>
            </el-col>
            <el-col :span="8" :xs="24">
              <el-form-item>
                <el-switch
                  v-model="autoMode"
                  active-text="自动模式"
                  inactive-text="手动模式"
                  @change="switchCurrentMode"
                />
              </el-form-item>
            </el-col>
            <!-- 导出按钮 -->
            <el-col :span="8" :xs="24">
              <el-form-item>
                <el-button type="primary" @click="exportExcel">导出 Excel</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 根据nodes数组中的数据生成对应的节点列表 -->
      <div v-for="(node, index) in nodes" :key="index">
        <h3>
          <!-- 显示节点编号 -->
          <span class="node-number">节点 {{ node.nodeNumber }}</span>
          <!-- 删除节点按钮，点击后调用deleteNode方法 -->
          <span class="delete-button">
            <el-button type="danger" :disabled="autoMode" @click="deleteNode(node.nodeNumber)">删除节点</el-button>
          </span>
        </h3>
        <!-- Element UI的Table组件，用于显示节点的继电器列表 -->
        <el-table
          :data="node.relays"
          stripe
          :border="true"
          highlight-current-row
          style="font-size: 1rem"
        >
          <!-- 继电器编号列 -->
          <el-table-column
            prop="relayNumber"
            label="阀门"
            align="center"
          />
          <!-- 控制状态列，使用Switch组件来显示和修改控制状态 -->
          <el-table-column
            prop="control"
            label="控制状态"
          >
            <template slot-scope="{ row }">
              <!-- 当Switch组件的状态改变时，调用handleControlChange方法 -->
              <el-switch
                v-model="row.control"
                active-color="#13ce66"
                inactive-color="#ff4949"
                :disabled="autoMode"
                @change="handleControlChange(node.nodeNumber, row.relayNumber, row.control)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>

    </el-card>
  </div>
</template>

<script>
import { getNodes, addNode, findNode, deleteNode, controlRelay, setCurrentMode, getCurrentMode } from '@/api/relay/relayApi'
import { options } from './options.js'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export default {
  data() {
    return {
      autoMode: '',
      mode: 'get', // 可以是 'get' 或 'find'

      // 存储从服务器获取的节点列表
      nodes: [],
      // 存储用户在表单中输入的数据
      paramsList: {
        nodeNumber: '',
        searchNode: ''
      },
      addingNode: false, // 声明并初始化添加节点的加载状态
      findingNode: false, // 声明并初始化查找节点的加载状态
      options: options
    }
  },
  async mounted() {
    try {
      await this.getNodes()
      const response = await getCurrentMode()
      this.autoMode = response.body.status

      this.dataInterval = setInterval(async() => {
        if (this.mode === 'get') {
          await this.getNodes(false) // 不显示成功消息
        } else if (this.mode === 'find') {
          await this.findNode(false)
        }

        const response = await getCurrentMode()
        this.autoMode = response.body.status
      }, 5000) // 每5秒执行一次
    } catch (error) {
      this.handleError(error)
    }
  },

  beforeDestroy() {
    if (this.dataInterval) {
      clearInterval(this.dataInterval)
    }
  },

  methods: {
    // 查找节点的方法
    async findNode(showSuccessMessage = true) {
      this.mode = 'find'
      this.findingNode = true // 开始查找节点，设置加载状态为true
      try {
        // 调用服务器接口，查找节点
        const nodeNumber = this.paramsList.searchNode
        this.validateNodeNumber(nodeNumber) // 调用校验方法进行节点编号的校验
        // 调用服务器接口，查找节点
        const res = await findNode(nodeNumber)
        if (res.success) {
          // 如果查找成功，更新nodes数组，并显示一个成功消息
          this.nodes = res.body ? [res.body] : []
          if (showSuccessMessage) {
            this.$message({
              message: '查找节点成功',
              type: 'success'
            })
          }
        } else {
          // 如果服务器返回的success字段为false，那么抛出一个错误
          this.handleError(new Error('查找节点失败'))
        }
      } catch (error) {
        // 如果在查找节点的过程中出现任何错误，那么处理这个错误
        this.handleError(error)
      } finally {
        this.findingNode = false // 无论成功还是失败，都将加载状态设置为false
      }
    },

    // 获取节点列表的方法。默认情况下，成功获取节点后会显示一个成功消息。
    async getNodes(showSuccessMessage = true) {
      this.mode = 'get'
      try {
        this.paramsList.searchNode = ''
        const res = await getNodes()
        if (res.success) {
          // 将获取到的节点列表存储到nodes数组中
          this.nodes = res.body.content
          // 如果需要显示成功消息，那么显示一个成功消息
          if (showSuccessMessage) {
            this.$message({
              message: '获取节点成功',
              type: 'success'
            })
          }
        } else {
          // 如果服务器返回的success字段为false，那么抛出一个错误
          this.handleError(new Error('获取节点失败'))
        }
      } catch (error) {
        // 如果在获取节点的过程中出现任何错误，那么处理这个错误
        this.handleError(error)
      }
    },

    // 添加节点的方法
    async addNode() {
      if (!this.nodes) {
        this.nodes = []
      }
      this.addingNode = true // 开始添加节点，设置加载状态为true
      try {
        const nodeNumber = this.paramsList.nodeNumber
        this.validateNodeNumber(nodeNumber) // 调用校验方法进行节点编号的校验

        // 调用服务器接口，添加节点
        const res = await addNode(nodeNumber)
        if (res.success) {
          // 如果添加成功，将新节点添加到nodes数组中，清空输入框，并显示一个成功消息
          const newNode = res.body
          this.nodes.push(newNode)
          this.paramsList.nodeNumber = ''
          this.$message({
            message: '添加节点成功',
            type: 'success'
          })
        } else {
          // 如果服务器返回的success字段为false，那么抛出一个错误
          this.handleError(new Error('重复添加节点'))
        }
      } catch (error) {
        // 如果在添加节点的过程中出现任何错误，那么处理这个错误
        this.handleError(error)
      } finally {
        this.addingNode = false // 无论成功还是失败，都将加载状态设置为false
      }
    },

    // 切换模式
    async switchCurrentMode(newMode) {
      const oldMode = this.autoMode
      try {
        const res = await setCurrentMode(newMode)
        if (res.success) {
          this.autoMode = newMode
          this.$message({
            message: '模式更改成功',
            type: 'success'
          })
        } else {
          throw new Error('设置当前模式失败')
        }
      } catch (error) {
        this.handleError(error)
        this.autoMode = oldMode
      }
    },

    // 导出表格
    exportExcel() {
      const data = this.nodes.flatMap(node => {
        return node.relays.map(relay => {
          return {
            '节点编号': node.nodeNumber,
            '阀门': relay.relayNumber,
            '控制状态': relay.control ? '开启' : '关闭'
          }
        })
      })

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const excelData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(excelData, '继电器信息.xlsx')
    },

    // 校验输入
    validateNodeNumber(nodeNumber) {
      // 校验不能为空
      if (!nodeNumber) {
        throw new Error('节点编号不能为空')
      }

      // 校验不能有空格
      if (nodeNumber.trim() !== nodeNumber) {
        throw new Error('节点编号不能包含空格')
      }

      // 校验长度限制
      const maxLength = 10 // 设置长度限制为10个字符
      if (nodeNumber.length > maxLength) {
        throw new Error('节点编号长度不能超过' + maxLength + '个字符')
      }

      return true
    },

    // 处理控制状态变化的方法
    async handleControlChange(nodeNumber, relayNumber, control) {
      const node = this.nodes.find((node) => node.nodeNumber === nodeNumber)
      const relay = node.relays.find((relay) => relay.relayNumber === relayNumber)

      // 在发起请求之前先暂存控制状态
      const previousControl = relay.control

      // 禁用开关按钮
      relay.disabled = true

      try {
        // 调用服务器接口，改变控制状态
        const res = await controlRelay({ nodeNumber, relayNumber, control })

        if (res.code === 200 && res.success) {
          const updatedRelay = res.body
          // 更新对应的控制状态，并显示一个成功消息
          relay.control = updatedRelay.control
          const message = control ? '继电器开启成功' : '继电器关闭成功'
          this.$message({
            message: message,
            type: 'success'
          })
        } else {
          // 如果控制状态改变失败或状态码不是200，则抛出一个错误，并恢复之前的状态
          throw new Error('控制继电器失败')
        }
      } catch (error) {
        // 如果在控制状态改变的过程中出现任何错误，那么处理这个错误，并恢复之前的状态
        this.handleError(error)
        relay.control = previousControl
      } finally {
        // 启用开关按钮
        relay.disabled = false
      }
    },

    // 删除节点的方法
    async deleteNode(nodeNumber) {
      // 调用服务器接口，删除节点
      const res = await deleteNode(nodeNumber)
      if (res.success) {
        // 如果删除成功，更新nodes数组，并显示一个成功消息
        this.nodes = this.nodes.filter(node => node.nodeNumber !== nodeNumber)
        this.$message({
          message: '删除节点成功',
          type: 'success'
        })
      } else {
        // 如果服务器返回的success字段为false，那么抛出一个错误
        this.handleError(new Error('删除节点失败'))
      }
    },
    // 处理错误的方法
    handleError(error) {
      // 先关闭所有的消息
      this.$message.closeAll()

      // 默认的错误消息是'操作失败'
      let message = error.message || '操作失败'

      // 根据HTTP状态码来确定错误消息
      if (error.response) {
        const status = error.response.status
        if (status === 400) {
          message = '请求错误'
        } else if (status === 401) {
          message = '未授权，请登录'
        } else if (status === 403) {
          message = '拒绝访问'
        } else if (status === 404) {
          message = '请求地址出错'
        } else if (status === 500) {
          message = '服务器内部错误'
        } else if (status === 502) {
          message = '网关错误'
        } else if (status === 503) {
          message = '服务不可用'
        } else if (status === 504) {
          message = '网关超时'
        }
      }

      // 显示错误消息
      this.$message({
        message: message,
        type: 'error'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
// 表单容器的样式
.top-form-contianer {
  margin-bottom: 15px;
}

// 节点编号的样式
.node-number {
  margin-right: 50px;
}

.findall{
  margin-top: 40px
}

</style>
