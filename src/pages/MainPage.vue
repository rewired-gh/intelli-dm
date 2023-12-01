<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import * as mm from '@magenta/music/es6'
import * as midiWriter from 'midi-writer-js'
import Peer from 'simple-peer/simplepeer.min'
import SamplePresetList from '../common/SamplePresetList'
import TransportIndicator from '../components/TransportIndicator.vue'
import VueQr from 'vue-qr/src/packages/vue-qr.vue'
import { neofetch, NETWORK_POLL_INTERVAL, NETWORK_WAIT_TIMEOUT_INTERVAL, waitUntil } from '../lib/WebRtcUtils'

const initValues = (name) => {
  const value = localStorage.getItem(name)
  if (value) {
    return parseFloat(value)
  } else {
    switch (name) {
    case 'Swing':
      return 0
    case 'Gain':
      return -8
    case 'LpFilterFrequency':
      return 12000
    case 'LpFilterQ':
      return 1
    case 'HpFilterFrequency':
      return 20
    case 'HpFilterQ':
      return 1
    case 'Distortion':
      return 0
    case 'DistortionWet':
      return 0
    case 'ChebyshevOrder':
      return 1
    case 'ChebyshevWet':
      return 0
    case 'DelayTime':
      return 0
    case 'DelayFeedback':
      return 0
    }
  }
}


const swing = ref(initValues('Swing'))
const gain = ref(initValues('Gain'))

const lpFilterFrequency = ref(initValues('LpFilterFrequency'))
const lpFilterQ = ref(initValues('LpFilterQ'))
const hpFilterFrequency = ref(initValues('HpFilterFrequency'))
const hpFilterQ = ref(initValues('HpFilterQ'))
const distortion = ref(initValues('Distortion'))
const distortionWet = ref(initValues('DistortionWet'))
const chebyshevOrder = ref(initValues('ChebyshevOrder'))
const chebyshevWet = ref(initValues('ChebyshevWet'))
const delayTime = ref(initValues('DelayTime'))
const delayFeedback = ref(initValues('DelayFeedback'))


watch(swing, (value) => {
  Tone.Transport.swing = value
})
watch(gain, (value) => {
  window.volumeChannel.volume.value = value
})
watch(lpFilterFrequency, (value) => {
  window.lpFilterChannel.set({
    frequency: `${value}hz`
  })
})
watch(lpFilterQ, (value) => {
  window.lpFilterChannel.set({
    Q: value
  })
})
watch(hpFilterFrequency, (value) => {
  window.hpFilterChannel.set({
    frequency: `${value}hz`
  })
})
watch(hpFilterQ, (value) => {
  window.hpFilterChannel.set({
    Q: value
  })
})
watch(distortion, (value) => {
  window.distortionChannel.set({
    distortion: value
  })
})
watch(distortionWet, (value) => {
  window.distortionChannel.set({
    wet: value
  })
})
watch(chebyshevOrder, (value) => {
  window.chebyshevChannel.set({
    order: value
  })
})
watch(chebyshevWet, (value) => {
  window.chebyshevChannel.set({
    wet: value
  })
})
watch(delayTime, (value) => {
  window.delayChannel.set({
    delayTime: value
  })
})
watch(delayFeedback, (value) => {
  window.delayChannel.set({
    feedback: value
  })
})

// Init Tone
window.volumeChannel = new Tone.Volume(-8)
window.lpFilterChannel = new Tone.Filter('12000hz', 'lowpass')
window.hpFilterChannel = new Tone.Filter('20hz', 'highpass')
window.distortionChannel = new Tone.Distortion({ distortion: 0, wet: 0 })
window.chebyshevChannel = new Tone.Chebyshev({ order: 1, wet: 0 })
window.delayChannel = new Tone.FeedbackDelay(0, 0)
window.volumeChannel.chain(window.distortionChannel, window.chebyshevChannel, window.lpFilterChannel, window.hpFilterChannel, window.delayChannel, Tone.Destination)

// Load default samples
const samplePresetList = ref([...SamplePresetList])
const samplers = []
samplePresetList.value[0].samplePaths.forEach((samplePath) => {
  samplers.push(new Tone.Sampler({ A1: samplePath })
    .connect(window.volumeChannel))
})
window.samplers = samplers

// Const
const _trackNumber = 11
const _totalSteps = 16
const maxVelocity = 3
const noteEventMap = new Map()
const keyToIndex = {
  a: 0,
  s: 1,
  d: 2,
  f: 3,
  j: 4,
  k: 5,
  l: 6,
  ';': 7,
  '\'': 8,
  n: 9,
  m: 10,
  ',': 11
}

// Handle key press
const onKeyPress = (event) => {
  const key = event.key
  const index = keyToIndex[key]
  if (index < samplers.length) {
    // console.log(key)
    window.samplers[index].triggerAttackRelease('A1', 3, Tone.immediate(), 0.8)
  }
}
window.addEventListener('keydown', onKeyPress)

// BPM
let bpm = ref(92)
{
  const value = localStorage.getItem('Bpm')
  if (value) {
    bpm = ref(parseFloat(value))
  }
}
Tone.Transport.bpm.value = bpm.value
watch(bpm, ((value) => {
  Tone.Transport.bpm.value = value
}))

// Basic note operations
const getEventId = (i, j) => {
  return i.toString() + j.toString()
}
const addNote = (i, j, velocity) => {
  const event = Tone.Transport.schedule((time) => {
    window.samplers[i].triggerAttackRelease('A1', 3, time, velocity)
  }, `0:0:${j}`)
  noteEventMap.set(getEventId(i, j), event)
}
const removeNote = (i, j) => {
  Tone.Transport.clear(
    noteEventMap.get(getEventId(i, j))
  )
}
const getNoteVelocity = (track, velocity) => {
  const maxRealVelocity = 0.8
  const minRealVelocity = 0
  return ((velocity / maxVelocity) * (maxRealVelocity - minRealVelocity))
    + minRealVelocity
}

// Transport
const indicator = ref(null)
const isPlaying = ref(false)
const playButtonType = computed(() => {
  return isPlaying.value ? 'danger' : 'success'
})
const playButtonText = computed(() => {
  return isPlaying.value ? 'Stop' : 'Play'
})
const onClickPlayButton = () => {
  if (isPlaying.value) {
    Tone.Transport.stop()
  } else {
    Tone.Transport.start()
  }
  isPlaying.value = !isPlaying.value
}
const resetTransport = () => {
  Tone.Transport.cancel()
  indicator.value.init()
}

// Track control
const trackNumber = ref(_trackNumber)
const initMatrix = () => {
  return Array.from(Array(trackNumber.value), () =>
    Array(_totalSteps).fill(0))
}
let velocityMatrix = ref(initMatrix())
{
  const value = localStorage.getItem('VelocityMatrix')
  if (value) {
    velocityMatrix = ref(JSON.parse(value))
    for (let [i, track] of velocityMatrix.value.entries())
      for (let j of track.keys())
        addNote(i, j, getNoteVelocity(i, velocityMatrix.value[i][j]))
  }
}
const onClickClearButton = () => {
  resetTransport()
  velocityMatrix.value = initMatrix()
}
const onClickShuffleButton = () => {
  resetTransport()
  let newVelocityMatrix = initMatrix()
  for (let [i, track] of newVelocityMatrix.entries()) {
    for (let j of track.keys()) {
      if (Math.random() < ProbabilityMap[i][j]) {
        newVelocityMatrix[i][j] = maxVelocity
        addNote(i, j, getNoteVelocity(i, maxVelocity))
      }
    }
  }
  velocityMatrix.value = newVelocityMatrix
}
const updateVelocity = (track, note, velocity) => {
  if (velocityMatrix.value[track][note] === 0) {
    if (velocity !== 0) {
      addNote(track, note, getNoteVelocity(track, velocity))
    }
  } else if (velocity !== velocityMatrix.value[track][note]) {
    removeNote(track, note)
    if (velocity !== 0) {
      addNote(track, note, getNoteVelocity(track, velocity))
    }
  }
  velocityMatrix.value[track][note] = velocity
}
let gainMap = ref([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
{
  const value = localStorage.getItem('GainMap')
  if (value) {
    gainMap = ref(JSON.parse(value))
  }
}
const updateGainMap = (i, value) => {
  gainMap.value[i] = value
  window.samplers[i].volume.value = value
}

// Kit control
const kitNumber = ref(0)
watch(kitNumber, (newValue, oldValue) => {
  let isResume = isPlaying.value
  if (isPlaying.value) {
    Tone.Transport.stop()
  }
  const samplers = []
  samplePresetList.value[newValue].samplePaths.forEach((samplePath) => {
    samplers.push(new Tone.Sampler({
      A1: samplePath
    }).connect(window.volumeChannel))
  })
  if (samplers.length > gainMap.value.length) {
    gainMap.value.push(
      ...(Array(samplers.length - gainMap.value.length)
        .fill(0)))
  }
  for (const [i, sampler] of samplers.entries()) {
    sampler.volume.value = gainMap.value[i]
  }
  window.samplers = samplers
  const oldLength = samplePresetList.value[oldValue].samplePaths.length,
    newLength = samplePresetList.value[newValue].samplePaths.length
  if (newLength > oldLength) {
    for (let i = oldLength; i < newLength; i++) {
      velocityMatrix.value.push(Array(_totalSteps).fill(0))
    }
  } else if (newLength < oldLength) {
    for (let i = newLength; i < oldLength; i++) {
      for (let j of velocityMatrix.value[i].keys()) {
        if (velocityMatrix.value[i][j] !== 0)
          Tone.Transport.clear(
            noteEventMap.get(getEventId(i, j))
          )
      }
    }
    velocityMatrix.value.splice(newLength - oldLength)
  }
  trackNumber.value = newLength
  if (isResume) {
    Tone.Transport.start()
  }
})

// Add or delete kit
// const sampleInput = ref(null)
const defaultUploadedKit = { name: '', samplePaths: [], midiNotes: [] }
const uploadedKit = ref({ ...defaultUploadedKit })
const isAddKitDialogVisible = ref(false)
const isUploadAreaActive = ref(false)
const resetUploadedKit = () => {
  uploadedKit.value.name = defaultUploadedKit.name
  uploadedKit.value.samplePaths = []
  uploadedKit.value.midiNotes = []
}
const onAddKitDialogClose = (done) => {
  onAddKitDialogCancel()
  done()
}
const onAddKitDialogCancel = () => {
  for (const path in uploadedKit.value.samplePaths) {
    URL.revokeObjectURL(path)
  }
  onDialogClose()
  isAddKitDialogVisible.value = false
}
const onAddKitDialogDone = () => {
  if (uploadedKit.value.samplePaths.length > 0 && uploadedKit.value.name) {
    samplePresetList.value.push(JSON.parse(JSON.stringify(uploadedKit.value)))
  }
  onDialogClose()
  isAddKitDialogVisible.value = false
}
const onAddSample = (event) => {
  const files = event.target.files
  if (files.length === 1) {
    uploadedKit.value.samplePaths.push(URL.createObjectURL(files[0]))
    uploadedKit.value.midiNotes.push(0)
  }
  // sampleInput.value.value = null
}
const onSampleDrop = (event) => {
  if (event.dataTransfer.items) {
    for (const item of event.dataTransfer.items) {
      console.log(item)
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file.type.startsWith('audio')) {
          uploadedKit.value.samplePaths.push(URL.createObjectURL(file))
          uploadedKit.value.midiNotes.push(0)
        }
      }
    }
  } else if (event.dataTransfer.files) {
    for (const file of event.dataTransfer.files) {
      if (file.type.startsWith('audio')) {
        uploadedKit.value.samplePaths.push(URL.createObjectURL(file))
        uploadedKit.value.midiNotes.push(0)
      }
    }
  }
  isUploadAreaActive.value = false
}
const onSampleOver = () => {
  isUploadAreaActive.value = true
}
const onSampleLeave = () => {
  isUploadAreaActive.value = false
}
const onRemoveSample = (index) => {
  URL.revokeObjectURL(uploadedKit.value.samplePaths[index])
  uploadedKit.value.samplePaths.splice(index, 1)
  uploadedKit.value.midiNotes.splice(index, 1)
}
const deleteKit = async (index) => {
  if (kitNumber.value >= index) {
    kitNumber.value = index - 1
    await nextTick()
  }
  for (const path in samplePresetList.value[index].samplePaths) {
    URL.revokeObjectURL(path)
  }
  samplePresetList.value.splice(index, 1)
}
const onAddKitDialogOpen = () => {
  window.removeEventListener('keydown', onKeyPress)
}
const onDialogClose = () => {
  window.addEventListener('keydown', onKeyPress)
  resetUploadedKit()
}

// ML generator
const isRnnReady = ref(false)
const isRegenerating = ref(false)
const rnn = new mm.MusicRNN('https://magenta-1259405466.cos.ap-guangzhou.myqcloud.com/cp/drum_rnn')
rnn.initialize().then(() => {
  isRnnReady.value = true
})
const midiDrum = [36, 39, 38, 42, 46, 82, 49, 50, 48, 45, 47]
const drumMidi = {
  36: 0, 39: 1, 38: 2, 51: 3, 42: 3, 46: 4, 82: 5,
  49: 6, 50: 7, 48: 8, 45: 9, 47: 10
}
let temperature = ref(1.1)
{
  const value = localStorage.getItem('Spice')
  if (value) {
    temperature = ref(parseFloat(value))
  }
}
const getNoteSequence = () => {
  const sequence = {
    notes: [],
    quantizationInfo: { stepsPerQuarter: 4 },
    timeSignatures: [
      {
        time: 0,
        numerator: 4,
        denominator: 4
      }
    ],
    tempos: [{ time: 0, qpm: bpm.value }],
    totalQuantizedSteps: _totalSteps
  }
  for (let [i, track] of velocityMatrix.value.entries()) {
    for (let j of track.keys()) {
      if (track[j] !== 0 && midiDrum[i]) {
        sequence.notes.push({
          pitch: midiDrum[i],
          quantizedStartStep: j,
          quantizedEndStep: j,
          isDrum: true
        })
      }
    }
  }
  return sequence
}
const onClickRegenerateButton = async () => {
  isRegenerating.value = true
  await new Promise(r => setTimeout(r, 100))
  const seedSequence = getNoteSequence()
  const newVelocityMatrix = initMatrix()
  let newSequence = await rnn.continueSequence(seedSequence, _totalSteps, temperature.value)
  onClickClearButton()
  for (const note of newSequence.notes) {
    const id = drumMidi[note.pitch]
    if (id !== undefined) {
      newVelocityMatrix[id][note.quantizedStartStep] = maxVelocity
      addNote(id, note.quantizedStartStep, getNoteVelocity(id, maxVelocity))
    }
  }
  velocityMatrix.value = newVelocityMatrix
  isRegenerating.value = false
}

// MIDI file
const exportUri = ref('')
const exportHook = ref(null)
const onClickExport = async () => {
  const atomicTick = 32
  const midiTrack = new midiWriter.Track()
  midiTrack.setTempo(bpm.value, 0)
  midiTrack.setTimeSignature(4, 4)
  midiTrack.addInstrumentName('Drum Kit')
  midiTrack.addTrackName('Drum Kit')
  for (let [i, track] of velocityMatrix.value.entries()) {
    for (let [j, note] of track.entries()) {
      if (note > 0) {
        midiTrack.addEvent(
          new midiWriter.NoteEvent({
            pitch: [samplePresetList.value[kitNumber.value].midiNotes[i]],
            duration: '16',
            velocity: getNoteVelocity(i, note) * 80,
            startTick: atomicTick * j,
            channel: 10
          })
        )
      }
    }
  }
  const exportMidi = new midiWriter.Writer(midiTrack)
  exportUri.value = exportMidi.dataUri()
  console.info(`Export MIDI: ${exportUri.value}`)
  // await new Promise(r => setTimeout(r, 100))
  await nextTick()
  exportHook.value.click()
}

// Data persistence
const onClickSaveButton = () => {
  if (localStorage) {
    dataSave()
  }
  // else {
  //   alert('localStorage not available')
  // }
}
const dataSave = () => {
  localStorage.setItem('Bpm', bpm.value)
  localStorage.setItem('Swing', swing.value)
  localStorage.setItem('Gain', gain.value)
  localStorage.setItem('Spice', temperature.value)
  localStorage.setItem('LpFilterFrequency', lpFilterFrequency.value)
  localStorage.setItem('LpFilterQ', lpFilterQ.value)
  localStorage.setItem('HpFilterFrequency', hpFilterFrequency.value)
  localStorage.setItem('HpFilterQ', hpFilterQ.value)
  localStorage.setItem('Distortion', distortion.value)
  localStorage.setItem('DistortionWet', distortionWet.value)
  localStorage.setItem('ChebyshevOrde', chebyshevOrder.value)
  localStorage.setItem('ChebyshevWet', chebyshevWet.value)
  localStorage.setItem('DelayTime', delayTime.value)
  localStorage.setItem('DelayFeedback', delayFeedback.value)
  localStorage.setItem('GainMap', JSON.stringify(gainMap.value))
  localStorage.setItem('VelocityMatrix', JSON.stringify(velocityMatrix.value))
}

// Remote server
const isRemoteStart = ref(false)
const isRemoteDialogVisible = ref(false)
const isConnected = ref(false)
const sessionId = ref(null)
const remoteClientUrl = computed(() =>
  new URL(`/#/remote/${sessionId.value}`, window.location.href).toString())
const onClickRemote = () => {
  isRemoteDialogVisible.value = true
}
const onClickRemoteStart = async () => {
  isRemoteStart.value = !isRemoteStart.value
  if (isRemoteStart.value) {
    const content = await neofetch('/trickle/new-session', {})
    if (!(content && content.ok)) return
    sessionId.value = content.id

    window.peer = new Peer({
      initiator: true,
      trickle: true,
      channelConfig: {
        ordered: true
      },
      config: {
        iceServers: [
          { urls: 'stun:stun.qq.com:3478' },
          { urls: 'stun:stun.miwifi.com:3478' }
        ]
      }
    })

    // window.peer._debug = console.log
    window.peer.on('signal', async (data) => {
      const description = JSON.stringify(data)
      await neofetch(
        '/trickle/set',
        {
          id: sessionId.value,
          inviter: description
        }
      )
    })
    window.peer.on('error', (error) => {
      console.error('simple-peer', error)
      onClickRemoteStart()
    })
    window.peer.on('data', onReceiveData)
    window.peer.on('connect', () => {
      isConnected.value = true
    })
    window.peer.on('close', () => {
      isConnected.value = false
    })

    let timeoutWaitInvitee = false
    setTimeout(() => {
      timeoutWaitInvitee = true
      if (!isConnected.value && window.peer) {
        window.peer.destroy()
      }
    }, NETWORK_WAIT_TIMEOUT_INTERVAL)

    await waitUntil(() => {
      neofetch('/trickle/get-invitee', {
        id: sessionId.value
      }).then((content) => {
        if (content && content.ok && content.invitee) {
          window.peer.signal(content.invitee)
        }
      })
      return isConnected.value || timeoutWaitInvitee
    }, NETWORK_POLL_INTERVAL)
  } else {
    sessionId.value = null
    window.peer.destroy()
  }
}
const onReceiveData = (data) => {
  const message = JSON.parse(data)
  console.log(message)

  switch (message.k) {
  case 'lp':
    lpFilterFrequency.value = message.v.x
    lpFilterQ.value = message.v.y
    break
  case 'hp':
    hpFilterFrequency.value = message.v.x
    hpFilterQ.value = message.v.y
    break
  case 'dl':
    delayTime.value = message.v.x
    delayFeedback.value = message.v.y
    break
  case 'ds':
    distortion.value = message.v.x
    distortionWet.value = message.v.y
    break
  case 'cs':
    chebyshevOrder.value = message.v.x
    chebyshevWet.value = message.v.y
    break
  }
}
const onRemoteDialogClose = (done) => {
  done()
}
// TODO
// const onRemoteStart = () => {
// }
</script>

<template>
  <el-row
    class="kit-row"
    justify="center"
  >
    <el-radio-group
      v-model="kitNumber"
    >
      <el-radio-button
        v-for="(kit, index) in samplePresetList"
        :key="`index${kit.name}`"
        :label="index"
      >
        <span>
          {{ kit.name }}
        </span>
        <button
          v-if="index >= SamplePresetList.length"
          class="kit-del-button"
          @click="deleteKit(index)"
        />
      </el-radio-button>
    </el-radio-group>
    <el-button
      plain
      @click="isAddKitDialogVisible = true"
    >
      Add a new kit
    </el-button>
    <Teleport to="#app">
      <el-dialog
        v-model="isAddKitDialogVisible"
        title="Add a new kit"
        :before-close="onAddKitDialogClose"
        @open="onAddKitDialogOpen"
      >
        <el-input
          v-model="uploadedKit.name"
          placeholder="Kit Name"
        />
        <el-row
          v-for="(path, index) in uploadedKit.samplePaths"
          :key="path"
          class="dialog-track-row"
          justify="space-between"
        >
          <span>{{ `Track ${index + 1}` }}</span>
          <el-input-number
            v-model="uploadedKit.midiNotes[index]"
            :min="0"
            :max="255"
            :step="1"
            step-strictly
            label="MIDI Note"
          />
          <el-button
            type="danger"
            round
            @click="onRemoveSample(index)"
          >
            Remove
          </el-button>
        </el-row>
        <label
          class="sample-upload-label"
          :class="{active: isUploadAreaActive}"
          @drop.prevent="onSampleDrop"
          @dragover.prevent="onSampleOver"
          @dragleave="onSampleLeave"
        >
          <input
            class="sample-input"
            type="file"
            accept="audio/*"
            @change="onAddSample"
          >
          Click here to add a new sample,<br>
          or drag and drop samples to here.
        </label>
        <template #footer>
          <el-button
            @click="onAddKitDialogCancel"
          >
            Cancel
          </el-button>
          <el-button
            type="primary"
            :disabled="!uploadedKit.name || uploadedKit.samplePaths.length < 1"
            @click="onAddKitDialogDone"
          >
            Done
          </el-button>
        </template>
      </el-dialog>
    </Teleport>
  </el-row>
  <el-row
    class="control-row"
    justify="center"
  >
    <el-popover
      :width="200"
      title="Tips"
      trigger="hover"
    >
      <ul>
        <li>
          Use your mouse wheel, arrow keys, or simply dragging it up and down to
          control knobs.
        </li>
        <li>You can de-select a beat by right-clicking it.</li>
      </ul>
      <template #reference>
        <el-button
          class="top-small-button"
          round
        >
          ?
        </el-button>
      </template>
    </el-popover>
    <el-button
      :disabled="isAudioReady"
      round
      size="large"
      type="primary"
      @click="onClickInitButton"
    >
      Init
    </el-button>
    <el-button
      :disabled="!isAudioReady"
      :type="playButtonType"
      round
      size="large"
      @click="onClickPlayButton"
    >
      {{ playButtonText }}
    </el-button>
    <el-button
      round
      size="large"
      type="warning"
      @click="onClickShuffleButton"
    >
      Shuffle
    </el-button>
    <el-button
      round
      size="large"
      type="danger"
      @click="onClickClearButton"
    >
      Clear
    </el-button>
    <base-knob
      v-model:value="bpm"
      :max-rotation-turn="1.35"
      :max-value="250"
      :min-value="40"
      display-name="BPM"
    />
    <base-knob
      :max-value="1"
      :min-value="0"
      :precision="2"
      :speed="0.01"
      :value="swing"
      display-name="Swing"
      @update:value="
        (event) => {
          swing = event;
        }
      "
    />
    <base-knob
      :max-value="0"
      :min-value="-40"
      :precision="1"
      :speed="0.1"
      :value="gain"
      display-name="Gain"
      @update:value="
        (event) => {
          gain = event;
        }
      "
    />
  </el-row>
  <el-row
    class="control-row"
    justify="center"
  >
    <el-button
      round
      size="large"
      type="primary"
      @click="onClickSaveButton"
    >
      Save
    </el-button>
    <el-button
      round
      size="large"
      type="primary"
      @click="onClickExport"
    >
      Export
    </el-button>
    <el-button
      round
      size="large"
      type="primary"
      @click="onClickRemote"
    >
      Remote
    </el-button>
    <Teleport to="#app">
      <el-dialog
        v-model="isRemoteDialogVisible"
        title="Remote Connection"
        :before-close="onRemoteDialogClose"
      >
        <el-button @click="onClickRemoteStart">
          {{ isRemoteStart ? 'Stop' : 'Start' }}
        </el-button>
        <p>
          {{ isConnected ? 'Connected' : 'Idle' }}
        </p>
        <a :href="sessionId ? remoteClientUrl : null">
          <p>{{ sessionId ? remoteClientUrl : 'Remote client is not available.' }}</p>
        </a>
        <vue-qr
          v-if="sessionId"
          :text="remoteClientUrl"
          :size="200"
        />
      </el-dialog>
    </Teleport>
    <el-button
      :disabled="(!isRnnReady && !isRegenerating) || kitNumber >= SamplePresetList.length"
      :loading="isRegenerating"
      round
      size="large"
      type="primary"
      @click="onClickRegenerateButton"
    >
      Regenerate
    </el-button>
    <base-knob
      v-model:value="temperature"
      :max-value="1.5"
      :min-value="0"
      :precision="2"
      :speed="0.01"
      display-name="Spice"
    />
  </el-row>
  <div class="drum-pad">
    <TransportIndicator ref="indicator" />
    <el-row
      v-for="i in trackNumber"
      :key="i - 1"
      :style="{filter: `hue-rotate(${(i - 1) * 30}deg) brightness(115%)`}"
      class="sequence-row"
      justify="center"
    >
      <sequence-track
        :id="i - 1"
        :beat-velocities="velocityMatrix[i - 1]"
        @update-velocity="updateVelocity"
      />
      <base-knob
        :is-compact="true"
        :is-value-hidden="true"
        :max-value="0"
        :min-value="-20"
        :speed="0.1"
        :value="gainMap[i - 1]"
        class="volume-knob"
        display-name="Gain"
        @update:value="(event) => {
          updateGainMap(i - 1, event);
        }"
      />
    </el-row>
    <el-row
      class="dpad-row"
      justify="center"
    >
      <BaseControlPad
        :max-x-value="12000"
        :max-y-value="16"
        :min-x-value="200"
        :min-y-value="1"
        :x-value="lpFilterFrequency"
        :y-value="lpFilterQ"
        x-name="LP Freq"
        y-name="LP Res"
        @update:x-value="(event) => {
          lpFilterFrequency = event;
        }"
        @update:y-value="(event) => {
          lpFilterQ = event;
        }"
      />
      <BaseControlPad
        :max-x-value="8000"
        :max-y-value="16"
        :min-x-value="20"
        :min-y-value="1"
        :x-value="hpFilterFrequency"
        :y-value="hpFilterQ"
        x-name="HP Freq"
        y-name="HP Res"
        @update:x-value="(event) => {
          hpFilterFrequency = event;
        }"
        @update:y-value="(event) => {
          hpFilterQ = event;
        }"
      />
      <BaseControlPad
        :max-x-value="0.6"
        :max-y-value="0.6"
        :min-x-value="0"
        :min-y-value="0"
        :x-value="delayTime"
        :y-value="delayFeedback"
        x-name="Delay Time"
        y-name="Feedback"
        @update:x-value="(event) => {
          delayTime = event;
        }"
        @update:y-value="(event) => {
          delayFeedback = event;
        }"
      />
    </el-row>
    <el-row
      class="dpad-row"
      justify="center"
    >
      <BaseControlPad
        :max-x-value="2"
        :max-y-value="1"
        :min-x-value="0"
        :min-y-value="0"
        :x-value="distortion"
        :y-value="distortionWet"
        x-name="Distortion"
        y-name="Mix"
        @update:x-value="(event) => {
          distortion = event;
        }"
        @update:y-value="(event) => {
          distortionWet = event;
        }"
      />
      <BaseControlPad
        :max-x-value="60"
        :max-y-value="1"
        :min-x-value="1"
        :min-y-value="0"
        :x-value="chebyshevOrder"
        :y-value="chebyshevWet"
        x-name="Order"
        y-name="Wet"
        @update:x-value="(event) => {
          chebyshevOrder = Math.trunc(event);
        }"
        @update:y-value="(event) => {
          chebyshevWet = event;
        }"
      />
    </el-row>
  </div>
  <a
    ref="exportHook"
    :href="exportUri"
    download="export_midi.mid"
    style="display: none;"
  />
</template>

<script>
import * as Tone from 'tone'
import ProbabilityMap from '../common/ProbabilityMap.js'
import BaseKnob from '../components/BaseKnob.vue'
import SequenceTrack from '../components/SequenceTrack.vue'
import BaseControlPad from '../components/BaseControlPad.vue'

export default {
  components: {
    BaseKnob,
    BaseControlPad,
    SequenceTrack
  },
  data() {
    return {
      isAudioReady: false
    }
  },
  methods: {
    onClickInitButton() {
      Tone.start()
      Tone.Transport.setLoopPoints(0, '1m')
      Tone.Transport.loop = true
      this.isAudioReady = true
    }
  }
}
</script>

<style scoped>
.control-row {
  margin: 0 0 20px 0;
}

.kit-row {
  margin: 0 0 40px 0;
}

.dpad-row {
  margin: 20px 20px 20px 0;
}

.volume-knob {
  margin: 5px 0 0 20px;
}

.top-small-button {
  margin: 4px 20px 0 20px;
}

.sequence-row {
  padding: 0 0 0 46px;
}

.drum-pad {
  padding: 10px 0;
}

.dialog-track-row {
  width: 100%;
  margin: 20px 0;
  align-items: center;
  justify-content: center;
}

.sample-input {
  display: none;
}

.sample-upload-label {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  height: 80px;
  border: 1px solid #dcdfe6;
  color: #b1b3b8;
  background-color: transparent;
  margin-top: 40px;
  border-radius: 20px;
  text-align: center;
  vertical-align: center;
  transition: all 0.16s ease-in-out;
  font-size: 15px;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
  'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.sample-upload-label:hover, .sample-upload-label.active {
  border-color: #409eff;
  color: #409eff;
  background-color: #f8fcff;
  cursor: pointer;
}

.kit-del-button {
  height: 12px;
  width: 12px;
  margin: 0 0 0 10px;
  padding: 0 0 0 0;
  background-color: #f56c6c;
  color: #ffffff;
  border: none;
  border-radius: 9999px;
  font-size: 10px;
}

/*.el-input, .el-input-number {*/
/*  -webkit-user-select: text;*/
/*}*/
</style>
