<template>
  <p>Your id is: {{ id }}</p>
  <p>{{ isConnected ? 'Connected' : 'Idle' }}</p>
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
</template>

<script setup>
import { defineProps, reactive, ref, watch } from 'vue'
import BaseControlPad from '../components/BaseControlPad.vue'
import Peer from 'simple-peer'
import { neofetch, NETWORK_JOIN_TIMEOUT_INTERVAL, NETWORK_POLL_INTERVAL, waitUntil } from '../lib/WebRtcUtils'

const props = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  id: String
})

const lp = reactive({ x: 1450, y: 3.3 })
watch(lp, (value) => {
  console.log('change')
  peer.send(JSON.stringify({
    k: 'lp', v: value
  }))
})

const isConnected = ref(false)
const peer = new Peer({
  initiator: false,
  trickle: true,
  channelConfig: {
    ordered: true
  }
})

peer._debug = console.log
peer.on('signal', async (data) => {
  const description = JSON.stringify(data)
  neofetch(
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
  timeoutWaitInviter = true
  peer.destroy()
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

</style>
