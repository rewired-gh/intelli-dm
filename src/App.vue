<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import * as mm from '@magenta/music/es6'
import * as midiWriter from 'midi-writer-js'
import SamplePresetList from './common/SamplePresetList'
import TransportIndicator from './components/TransportIndicator.vue'

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
const onKeyPress = (key) => {
  const index = keyToIndex[key]
  if (index < samplers.length) {
    // console.log(key)
    window.samplers[index].triggerAttackRelease('A1', 3, Tone.immediate(), 0.8)
  }
}
window.addEventListener('keydown', (e) => {
  onKeyPress(e.key)
})

// BPM
const bpm = ref(92)
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
const velocityMatrix = ref(initMatrix())
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
const gainMap = ref([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
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
const defaultUploadedKit = { name: 'Untitled', samplePaths: [], midiNotes: [] }
const uploadedKit = ref({ ...defaultUploadedKit })
const isAddKitDialogVisible = ref(false)
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
  resetUploadedKit()
  isAddKitDialogVisible.value = false
  console.log(uploadedKit.value)
}
const onAddKitDialogDone = () => {
  if (uploadedKit.value.samplePaths.length > 0 && uploadedKit.value.name) {
    samplePresetList.value.push(JSON.parse(JSON.stringify(uploadedKit.value)))
  }
  resetUploadedKit()
  isAddKitDialogVisible.value = false
}
const onAddSample = (event) => {
  const files = event.target.files
  if (files.length === 1) {
    uploadedKit.value.samplePaths.push(URL.createObjectURL(files[0]))
    uploadedKit.value.midiNotes.push(0)
  }
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
const temperature = ref(1.1)
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
          @click="deleteKit(index)"
        >
          del
        </button>
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
      >
        <el-input
          v-model="uploadedKit.name"
          placeholder="Kit Name"
        />
        <div>
          <el-row
            v-for="(path, index) in uploadedKit.samplePaths"
            :key="path"
            class="dialog-track-row"
            justify="space-between"
          >
            <span>{{ `Track ${index + 1}` }}</span>
            <el-input-number />
            <el-button />
          </el-row>
        </div>
        <input
          type="file"
          @change="onAddSample"
        >
        <template #footer>
          <el-button
            @click="onAddKitDialogCancel"
          >
            Cancel
          </el-button>
          <el-button
            type="primary"
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
      @click="onClickExport"
    >
      Export
    </el-button>
    <el-button
      :disabled="!isRnnReady && !isRegenerating"
      :loading="isRegenerating"
      round
      size="large"
      type="primary"
      @click="onClickRegenerateButton"
    >
      <span>
        Regenerate
      </span>
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
  <el-footer>
    「过程淘汰」· All Rights Reserved · © 2022
  </el-footer>
  <a
    ref="exportHook"
    :href="exportUri"
    download="export_midi.mid"
    style="display: none;"
  />
</template>

<script>
import * as Tone from 'tone'
import ProbabilityMap from './common/ProbabilityMap.js'
import BaseKnob from './components/BaseKnob.vue'
import SequenceTrack from './components/SequenceTrack.vue'
import BaseControlPad from './components/BaseControlPad.vue'

export default {
  components: {
    BaseKnob,
    BaseControlPad,
    SequenceTrack
  },
  data() {
    return {
      isAudioReady: false,
      gain: -8,
      swing: 0,
      lpFilterFrequency: 12000,
      lpFilterQ: 1,
      hpFilterFrequency: 20,
      hpFilterQ: 1,
      distortion: 0,
      distortionWet: 0,
      chebyshevOrder: 1,
      chebyshevWet: 0,
      delayTime: 0,
      delayFeedback: 0
    }
  },
  watch: {
    swing(value) {
      Tone.Transport.swing = value
    },
    gain(value) {
      window.volumeChannel.volume.value = value
    },
    lpFilterFrequency(value) {
      window.lpFilterChannel.set({
        frequency: `${value}hz`
      })
    },
    lpFilterQ(value) {
      window.lpFilterChannel.set({
        Q: value
      })
    },
    hpFilterFrequency(value) {
      window.hpFilterChannel.set({
        frequency: `${value}hz`
      })
    },
    hpFilterQ(value) {
      window.hpFilterChannel.set({
        Q: value
      })
    },
    distortion(value) {
      window.distortionChannel.set({
        distortion: value
      })
    },
    distortionWet(value) {
      window.distortionChannel.set({
        wet: value
      })
    },
    chebyshevOrder(value) {
      window.chebyshevChannel.set({
        order: value
      })
    },
    chebyshevWet(value) {
      window.chebyshevChannel.set({
        wet: value
      })
    },
    delayTime(value) {
      window.delayChannel.set({
        delayTime: value
      })
    },
    delayFeedback(value) {
      window.delayChannel.set({
        feedback: value
      })
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

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding-top: 40px;
}

html,
body {
  height: 100%;
  width: 100%;
}

.el-footer {
  font-size: 12px;
  margin: 80px 0;
}

ul {
  padding: 0 0 0 16px;
  margin: 0;
  word-break: normal;
}

* {
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Old versions of Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none;
}

.el-row > * {
  margin: 0 20px;
}

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

.el-popover {
  border-radius: 14px !important;
  padding: 22px !important;
  word-break: normal;
}

body, #app, .el-row, .el-popover, .el-button {
  font-family: Ruda, Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.drum-pad {
  padding: 10px 0;
}

.dialog-track-row {
  width: 100%;
  margin: 20px 0;
}
</style>
