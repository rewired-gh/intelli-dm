<template>
  <p>Your id is: {{ id }}</p>
  <p>{{ isConnected ? 'Connected' : 'Idle' }}</p>
  <el-row
    :gutter="20"
    justify="center"
    align="middle"
    class="control-row"
  >
    <BaseControlPad
      :max-x-value="12000"
      :max-y-value="16"
      :min-x-value="200"
      :min-y-value="1"
      :x-value="lp.x"
      :y-value="lp.y"
      x-name="LP Freq"
      y-name="LP Res"
      @update:x-value="(event) => {
        lp.x = event;
      }"
      @update:y-value="(event) => {
        lp.y = event;
      }"
    />
    <BaseControlPad
      :max-x-value="8000"
      :max-y-value="16"
      :min-x-value="20"
      :min-y-value="1"
      :x-value="hp.x"
      :y-value="hp.y"
      x-name="HP Freq"
      y-name="HP Res"
      @update:x-value="(event) => {
        hp.x = event;
      }"
      @update:y-value="(event) => {
        hp.y = event;
      }"
    />
    <BaseControlPad
      :max-x-value="0.6"
      :max-y-value="0.6"
      :min-x-value="0"
      :min-y-value="0"
      :x-value="dl.x"
      :y-value="dl.y"
      x-name="Delay Time"
      y-name="Feedback"
      @update:x-value="(event) => {
        dl.x = event;
      }"
      @update:y-value="(event) => {
        dl.y = event;
      }"
    />
    <BaseControlPad
      :max-x-value="2"
      :max-y-value="1"
      :min-x-value="0"
      :min-y-value="0"
      :x-value="ds.x"
      :y-value="ds.y"
      x-name="Distortion"
      y-name="Mix"
      @update:x-value="(event) => {
        ds.x = event;
      }"
      @update:y-value="(event) => {
        ds.y = event;
      }"
    />
    <BaseControlPad
      :max-x-value="60"
      :max-y-value="1"
      :min-x-value="1"
      :min-y-value="0"
      :x-value="cs.x"
      :y-value="cs.y"
      x-name="Order"
      y-name="Wet"
      @update:x-value="(event) => {
        cs.x = Math.trunc(event);
      }"
      @update:y-value="(event) => {
        cs.y = event;
      }"
    />
  </el-row>
</template>

<script setup>
import { defineProps, reactive, ref, watch } from 'vue'
import BaseControlPad from '../components/BaseControlPad.vue'
import Peer from 'simple-peer/simplepeer.min'
import { neofetch, NETWORK_JOIN_TIMEOUT_INTERVAL, NETWORK_POLL_INTERVAL, waitUntil } from '../lib/WebRtcUtils'

const props = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  id: String
})

const isConnected = ref(false)
const peer = new Peer({
  initiator: false,
  trickle: true,
  channelConfig: {
    ordered: true
  }
})

const lp = reactive({ x: 12000, y: 1 })
watch(lp, (value) => {
  peer.send(JSON.stringify({
    k: 'lp', v: value
  }))
})

const hp = reactive({ x: 20, y: 1 })
watch(hp, (value) => {
  peer.send(JSON.stringify({
    k: 'hp', v: value
  }))
})

const dl = reactive({ x: 0, y: 0 })
watch(dl, (value) => {
  peer.send(JSON.stringify({
    k: 'dl', v: value
  }))
})

const ds = reactive({ x: 0, y: 0 })
watch(ds, (value) => {
  peer.send(JSON.stringify({
    k: 'ds', v: value
  }))
})

const cs = reactive({ x: 1, y: 0 })
watch(cs, (value) => {
  peer.send(JSON.stringify({
    k: 'cs', v: value
  }))
})

// peer._debug = console.log
peer.on('signal', async (data) => {
  const description = JSON.stringify(data)
  await neofetch(
    '/trickle/set',
    {
      id: props.id,
      invitee: description
    }
  )
})
peer.on('error', (error) => {
  console.error('simple-peer', error)
  peer.destroy()
})
// peer.on('data', ()=>{})
peer.on('connect', () => {
  isConnected.value = true
})
peer.on('close', () => {
  isConnected.value = false
})

let timeoutWaitInviter = false

setTimeout(() => {
  if (!isConnected.value && window.peer) {
    timeoutWaitInviter = true
    peer.destroy()
  }
}, NETWORK_JOIN_TIMEOUT_INTERVAL)

waitUntil(() => {
  neofetch('/trickle/get-inviter', {
    id: props.id
  }).then((content) => {
    if (content && content.ok && content.inviter) {
      peer.signal(content.inviter)
    }
  })
  return isConnected.value || timeoutWaitInviter
}, NETWORK_POLL_INTERVAL)
</script>

<style scoped>
.control-row {
  padding-top: 20px;
  transform: translateX(-12px);
}

.control-row > * {
  margin-bottom: 20px;
}
</style>
