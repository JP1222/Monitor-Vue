<template>
  <div class="dashboard-container">
    <first-try />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import firstTry from '../../components/echarts/firstTry.vue'

export default {
  components: { firstTry },
  name: 'Dashboard',
  computed: {
    ...mapGetters(['name'])
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  &-container {
    margin: 10px;
  }
  &-text {
    font-size: 30px;
    line-height: 46px;
  }
}
</style>
