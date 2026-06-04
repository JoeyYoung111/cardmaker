<script setup lang="ts">
import { Ref, ref } from 'vue'
import Maker from './components/maker/Maker.vue'

const refVersion: Ref<string> = ref('2.5.4')

window.onbeforeunload = () => {
  return "您确认要离开吗？所有内容将会丢失！"
}
</script>

<template>
  <div id="nav-bar" class="row-flex-center">
    <div class="title">
      <div>制卡器</div>
    </div>
    <div class="nav-btn active">
      <div>制卡器</div>
    </div>
  </div>

  <div style="width: fit-content;">
    <Maker :version="refVersion"></Maker>
  </div>
</template>

<style scoped>
#nav-bar {
  background-color: rgb(44, 49, 50);
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  font-family: "PingFang SC", SimHei, Monaco, Consolas, monospace;
}

.nav-btn {
  color: rgb(221, 221, 221);
  padding: 10px 10px;
  height: 100%;
  display: flex;
  place-items: center;
  user-select: none;
  font-size: 15px;
}

.nav-btn.active {
  color: white;
  cursor: default;
}

.title {
  padding: 0px 10px;
  height: 100%;
  user-select: none;
  font-size: 15px;
  font-weight: 500;
  background: linear-gradient(to bottom right, #fff3b0, #ca26ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.row-flex-center {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  place-items: center;
  padding: 1px;
}
</style>
