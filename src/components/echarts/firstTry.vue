<template>
  <div class="chart-container">
    <el-card class="box-card" shadow="hover">
      <el-form :inline="true" class="demo-form-inline">
        <el-row :gutter="20">
          <el-col v-for="index in 8" :key="index" :span="3">
            <el-form-item :label="'节点' + index">
              <el-input v-model="nodes[index - 1]" placeholder=""></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <el-button type="primary" size="large" @click="fetchData">查询</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
    <div ref="chart" style="width: 100%; height: 100%;"></div>

  </div>

</template>

<script>
import axios from 'axios';
import * as echarts from 'echarts';

export default {
  data() {
    return {
      nodes: Array(8).fill(''),
      chart: null,
      timer: null,
      requestSource: axios.CancelToken.source()
    }
  },
  mounted() {
    this.chart = echarts.init(this.$refs.chart);
    this.timer = setInterval(this.fetchData, 5000);

  },
  beforeDestroy() {
    clearInterval(this.timer);
    this.requestSource.cancel('Component is being destroyed');

  },
  methods: {
    async fetchData() {
      let filteredNodes = this.nodes.filter(node => node.trim() !== '');
      try {
        let response = await axios.post('http://47.114.81.63:8081/node/chartData', {
          nodes: filteredNodes
        }, {
          cancelToken: this.requestSource.token
        });
        if (response.data.success) {
          this.updateChart(response.data.body );
        } else {
          this.$message.error('获取数据失败');
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request canceled', error.message);
        } else {
          this.$message.error('请求错误: ' + error.message);
        }
      }
    },
    updateChart(data) {
      const option = {
        tooltip: {
          trigger: 'axis',
          position: function (pt) {
            return [pt[0], '10%'];
          }
        },
        title: {
          text: 'Large Ara Chart'
        },
        legend: {},
        toolbox: {
          feature: {
            dataZoom: {
              yAxisIndex: 'none'
            },
            restore: {},
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'time',
          boundaryGap: false
        },
        yAxis: {
          type: 'value',
          boundaryGap: [0, '100%']
        },
        dataZoom: [
          {
            type: 'inside',
            start: 0,
            end: 20
          },
          {
            start: 0,
            end: 20
          }
        ],
        series: [
          {
            name: 'Fake Data',
            type: 'line',
            smooth: true,
            symbol: 'none',
            areaStyle: {},
            tooltip: {},
            data: data
          },
          // {
          //   name: 'Data',
          //   type: 'line',
          //   smooth: true,
          //   symbol: 'none',
          //   areaStyle: {},
          //   tooltip: {},
          //   data: data2
          // }
        ]
      };
      if (this.chart) {
        this.chart.setOption(option);
      }
    },
  }

}
</script>

<style scoped>

.demo-form-inline .el-form-item {
  margin-right: 5px; /* 增加表单项之间的间距 */
}
</style>
