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
          <el-col>
            <el-form-item>
              <el-button type="primary" size="large" @click="fetchData">查询</el-button>
              <span id="Tips">按键跳转</span>
              <el-button v-for="(dataType, index) in chartDataTypesTitles" :key="dataType" @click="goToChart(index)">
                {{ dataType }}
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- Add chart divs for each data type -->
    <div v-for="dataType in chartDataTypes" :key="dataType" :id="dataType" :ref="dataType" style="width: 100%; height: 500px; margin-top: 20px;"></div>

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
      chartDataTypes: ['AirWet', 'AirTemperature', 'CO2', 'Light', 'SoilWet', 'SoilTemperature'],
      chartDataTypesTitles: ['空气湿度', '空气温度', '二氧化碳', '光照', '土壤湿度', '土壤温度'],
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
    //跳转到对应图表按钮
    goToChart(index) {
      const element = document.getElementById(this.chartDataTypes[index]);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    },
    //向后端获取数据方法
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
      const formattedData = this.formatChartData(data);//调用格式化方法把后端数据格式化
      // console.log(formattedData)//可以去控制台查看格式后的数据

      this.chartDataTypes.forEach((dataType, index) => {
        const seriesData = [];
        for (const node in formattedData[dataType]) {
          formattedData[dataType][node].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));//排序方便数据按顺序展示
          const times = formattedData[dataType][node].map(entry => entry.timestamp);//返回每个节点的timestamp属性（数组）
          const values = formattedData[dataType][node].map(entry => entry.value);
          // formattedData[dataType][node] = [
          //   { timestamp: '2023-08-01', value: 10 },
          //   { timestamp: '2023-08-02', value: 12 },
          //   { timestamp: '2023-08-03', value: 11 }
          // ];
          //变成
          // times = ['2023-08-01', '2023-08-02', '2023-08-03'];
          // values = [10, 12, 11];

          seriesData.push({
            name: node,
            type: 'line',
            smooth: true,
            data: values.map((value, index) => [times[index], value])
            //这个输入[10, 12, 11]，返回
            // [
            //   ['2023-08-01', 10],
            //   ['2023-08-02', 12],
            //   ['2023-08-03', 11]
            // ]这个默认第一个是x轴，第二个是y轴
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
            text: this.chartDataTypesTitles[index]//这里把图表标题改为中文
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

#Tips{
  margin: 0 10px 0 30px;
  font-size: 18px;
 }
</style>
