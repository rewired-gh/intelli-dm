<template>
  <div class="wrapper">
    <el-row
      :gutter="20"
      justify="center"
    >
      <div
        v-for="beat in length"
        :key="beat"
        class="beat"
        :class="{ on: statusArray[beat-1] }"
      />
    </el-row>
  </div>
</template>

<script setup>
import { ref, defineExpose, defineProps } from 'vue'
import * as Tone from 'tone'

const props = defineProps({
  length: { type: Number, default: 16 }
})

const statusArray = ref(new Array(props.length).fill(false))

const blink = (beat) => {
  statusArray.value[beat] = true
  const duration = 12000 / Tone.Transport.bpm.value
  setTimeout(() => {
    statusArray.value[beat] = false
  }, duration)
}

const init = () => {
  for (let i = 0; i < props.length; i++) {
    Tone.Transport.schedule(() => {
      setTimeout(() => {
        blink(i)
      }, 100)
    }, `0:0:${i}`)
  }
}

defineExpose({ init })

init()
</script>

<style lang='scss' scoped>
$highlight-color: #ff6699;
$primary-color: #409eff;
$secondary-color: #ffffff;

.wrapper {
  padding-right: 4px;
}

.beat {
  padding: 0;
  margin: 10px 8px;
  width: 26px;
  height: 4px;
  border-radius: 9999px;
  border: 1px solid $primary-color;
  background-color: $secondary-color;
  overflow: hidden;
  transition: background-color 50ms ease-out;
}

.beat:nth-child(4n+1) {
  border-color: $highlight-color;
}

.beat.on {
  background-color: $primary-color;
}

.beat.on:nth-child(4n+1) {
  background-color: $highlight-color;
}
</style>
