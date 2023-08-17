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

    <!-- Add chart divs for each data type -->
    <div v-for="dataType in chartDataTypes" :key="dataType" :ref="dataType" style="width: 100%; height: 500px; margin-top: 20px;"></div>

  </div>
</template>

<script>
import axios from 'axios';
import * as echarts from 'echarts';

export default {
  data() {
    return {
      nodes: Array(8).fill(''),
      charts: {},  // Store multiple charts
      timer: null,
      requestSource: axios.CancelToken.source(),
      chartDataTypes: ['AirWet', 'AirTemperature', 'CO2', 'Light', 'SoilWet', 'SoilTemperature']
    }
  },
  mounted() {
    this.chartDataTypes.forEach(dataType => {
      this.charts[dataType] = echarts.init(this.$refs[dataType][0]);
    });
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
          this.updateChart(response.data.body);//这里调用updateChart修改图表数据
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

    //把后端数据修改适合图表展示
    formatChartData(rawData) {
      const result = {};
      this.chartDataTypes.forEach(dataType => {
        result[dataType] = {};
        for (const node in rawData[0]) {
          rawData[0][node].forEach(dataObj => {
            if (dataObj[dataType]) {
              result[dataType][node] = dataObj[dataType].map(dataEntry => {
                const parts = dataEntry.split(' : ');
                return {
                  timestamp: parts[0],
                  value: parseFloat(parts[1])
                };
              });
            }
          });
        }
      });
      return result;
    },
    //修改图表数据的方法
    updateChart(data) {
      const formattedData = this.formatChartData(data);
      this.chartDataTypes.forEach(dataType => {
        const seriesData = [];
        for (const node in formattedData[dataType]) {
          formattedData[dataType][node].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));//排序方便数据按顺序展示
          const times = formattedData[dataType][node].map(entry => entry.timestamp);
          const values = formattedData[dataType][node].map(entry => entry.value);
          seriesData.push({
            name: node,
            type: 'line',
            smooth: true,
            data: values.map((value, index) => [times[index], value])
          });
        }
        const option = {
          tooltip: {
            trigger: 'axis',
            position: function (pt) {
              return [pt[0], '10%'];
            }
          },
          title: {
            text: dataType
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
              end: 100
            },
            {
              start: 0,
              end: 100
            }
          ],
          series: seriesData
        };
        this.charts[dataType].setOption(option);
      });
    }
  }
}
</script>

<style scoped>
.demo-form-inline .el-form-item {
  margin-right: 5px;
}
</style>
