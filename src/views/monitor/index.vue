<template>
  <div>
    <el-card padding="20px">
      <div class="top-form-container">
        <el-form ref="form" :model="paramsList" label-width="80px">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="起始时间">
                <!-- <el-date-picker v-model="paramsList.startDate" align="right" type="date" -->
                <el-date-picker v-model="startDate" align="right" type="date" placeholder="选择日期" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="结束时间">
                <!-- <el-date-picker v-model="paramsList.endDate" align="right" type="date" -->
                <el-date-picker v-model="endDate" align="right" type="date" placeholder="选择日期" />
              </el-form-item>
            </el-col>
            <!-- <el-col :span="6">
              <el-form-item label="节点编号">
                <el-input v-model="paramsList.number"></el-input>
              </el-form-item>
            </el-col> -->
            <!-- <el-col :span="4">
              <el-button @click="getData" type="primary">查询</el-button>
            </el-col> -->
          </el-row>
          <el-row>
            <el-col :span="6" :xs="24">
              <el-form-item>
                <el-switch v-model="autoMode" active-text="自动模式" inactive-text="手动模式" @change="switchCurrentMode">
                  ></el-switch>
              </el-form-item>
            </el-col>
            <!-- 导出按钮 -->
            <el-col :span="4" :xs="24">
              <el-form-item>
                <el-button type="primary" @click="downloadExcel">导出Excel表格</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <!--表格部分-->
      <el-table
        :data="tableData"
        stripe
        :border="true"
        :height="getHeightWithOutHeader"
        highlight-current-row
        style="font-size: 1rem"
      >
        <el-table-column
          v-for="(item, index) in options"
          :key="index"
          :prop="item.prop"
          :label="item.label"
        >

          <!-- 如果是操作那一行就渲染一个控制开关 -->
          <template v-if="item.prop === 'action'" v-slot="{ row }">
            <el-switch
              v-model="row.control"
              active-color="#13ce66"
              inactive-color="#ff4949"
              :disabled="autoMode"
              @change="handleControlChange(row.id, row.control)"
            />
          </template>

          <!-- 如果是删除那一行就渲染一个删除开关，注意这里需要加上else，因为有两个template如果不加上else下面会把上面的替换掉 -->
          <template v-else-if="item.prop === 'delete'" v-slot="{ row }">
            <el-button type="danger" plain @click="deleteMethod(row.number)">删除节点</el-button>
          </template>
          <!-- 是选择列就渲染一个单选框-->
          <template v-else-if="item.prop === 'select'" v-slot="{ row }">
            <el-checkbox v-model="selectPoints" :label="row.number" border />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import {
  getCurrentMode,
  setCurrentMode,
  getPoint,
  pointControlChange,
  getExcel,
  deletePoint
} from '@/api/monitor/point'
import { options } from './options.js'
import { getHeightWithOutHeader } from '@/utils/validate'
import { format } from 'date-fns'

export default {
  data() {
    return {
      selectPoints: [],
      autoMode: true, // 自动模式初始化

      startDate: '', // 导出表格选择时间初始化
      endDate: '',

      tableData: [],
      paramsList: {
        pageNum: 1,
        pageSize: 10
      },
      options: options,
      getHeightWithOutHeader: getHeightWithOutHeader()
    }
  },
  async mounted() {
    try {
      // 先执行一次
      const response = await getCurrentMode()
      this.autoMode = response.body.status
      await this.getData()

      this.dataInterval = setInterval(async() => {
        await this.getData()
        const response = await getCurrentMode()
        this.autoMode = response.body.status
      }, 5000)
    } catch (error) {
      this.handleError(error)
    }
  },

  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },

  methods: {
    // 删除节点
    async deleteMethod(nodenumber) {
      try {
        const res = await deletePoint(nodenumber)
        if (res.success) {
          this.$message({
            message: '删除成功',
            type: 'success'
          })
        }
        await this.getData()
      } catch (error) {
        this.handleError(error)
      }
    },
    // 导出表格
    async downloadExcel() {
      // 获取开始日期和结束日期
      const startDate = this.startDate // 替换为实际的开始日期
      const endDate = this.endDate // 替换为实际的结束日期

      // 检查 startDate 和 endDate 是否为有效的日期对象
      if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
        this.$message({
          message: '选择有效的开始日期和结束日期',
          type: 'warning'
        })
        return
      }

      // 使用 format 函数将日期格式化为 'YYYY-MM-DD' 格式
      const formattedStartDate = format(startDate, 'yyyy-MM-dd')
      const formattedEndDate = format(endDate, 'yyyy-MM-dd')

      try {
        await getExcel(formattedStartDate, formattedEndDate, this.selectPoints)
        // 下载成功后的操作
        this.$message({
          message: '导出成功',
          type: 'success'
        })
      } catch (error) {
        // 处理下载失败的情况
        console.error(error)
      }
    },

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

    async getData() {
      const res = await getPoint(this.paramsList)
      console.log(this.paramsList)
      if (res.success) {
        this.tableData = res.body.content
      }
    },

    handleControlChange(id, control) {
      if (!this.autoMode) return
      if (this.t) {
        clearTimeout(this.t)
      }
      this.t = setTimeout(async() => {
        try {
          const res = await pointControlChange({ id, control })
          if (res.success) {
            const mesg = control ? '开启成功' : '关闭成功'
            this.$message(mesg)
          } else {
            throw new Error('控制操作失败')
          }
        } catch (error) {
          this.handleError(error)
        }
      }, 1000)
    },

    handleError(error) {
      // 处理错误逻辑，例如显示错误信息
      console.error(error)
      this.$message.error('操作失败')
    }
  }
}
</script>

<style lang="scss" scoped>
.top-form-container {
  margin-bottom: 15px;
}
</style>
