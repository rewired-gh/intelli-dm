<script setup>
import { computed, ref, watch, } from 'vue';

window.volumeChannel = new Tone.Volume(-8,);
window.filterChannel = new Tone.Filter('12000hz', 'lowpass',);
window.distortionChannel = new Tone.Distortion(0,);
window.delayChannel = new Tone.FeedbackDelay(0, 0,);
window.volumeChannel.chain(
  window.delayChannel, window.distortionChannel, window.filterChannel,
  Tone.Destination,);

const samplers = [];
SamplePresetList[0].samplePaths.forEach((samplePath,) => {
  samplers.push(new Tone.Sampler({
    A1: samplePath,
  },).connect(window.volumeChannel,),);
},);

window.samplers = samplers;

const _trackNumber = 11;
const maxVelocity = 3;
const noteEventMap = new Map();

const addNote = (id, note, velocity,) => {
  const event = Tone.Transport.schedule((time,) => {
    window.samplers[id].triggerAttackRelease('A1', 3, time, velocity,);
  }, '0:0:' + note,);
  noteEventMap.set(id.toString() + note.toString(), event,);
};
const removeNote = (id, note,) => {
  Tone.Transport.clear(
    noteEventMap.get(id.toString() + note.toString(),),
  );
};
const getNoteVelocity = (id, velocity,) => {
  const maxRealVelocity = 0.8;
  const minRealVelocity = 0;
  return ((velocity / maxVelocity) * (maxRealVelocity - minRealVelocity))
    + minRealVelocity;
};

const isPlaying = ref(false,);
const playButtonType = computed(() => {
  return isPlaying.value ? 'danger' : 'success';
},);
const playButtonText = computed(() => {
  return isPlaying.value ? 'Stop' : 'Play';
},);
const onClickPlayButton = () => {
  if (isPlaying.value) {
    Tone.Transport.stop();
  } else {
    Tone.Transport.start();
  }
  isPlaying.value = !isPlaying.value;
};

const trackNumber = ref(_trackNumber,);

const velocityMatrix = ref(Array.from(Array(_trackNumber,),
  () => Array(16,).fill(0,),),);
const onClickClearButton = () => {
  velocityMatrix.value = Array.from(Array(trackNumber.value,), () =>
    Array(16,).fill(0,),
  );
  Tone.Transport.cancel();
};
const onClickShuffleButton = () => {
  Tone.Transport.cancel();
  let newVelocityMatrix = Array.from(Array(trackNumber.value,), () =>
    Array(16,).fill(0,),
  );
  for (let i = 0; i < newVelocityMatrix.length; i++) {
    for (let j = 0; j < newVelocityMatrix[i].length; j++) {
      if (Math.random() < ProbabilityMap[i][j]) {
        newVelocityMatrix[i][j] = maxVelocity;
        addNote(
          i,
          j,
          getNoteVelocity(i, newVelocityMatrix[i][j],),
        );
      } else {
        newVelocityMatrix[i][j] = 0;
      }
    }
  }
  velocityMatrix.value = newVelocityMatrix;
};
const updateVelocity = (id, note, velocity,) => {
  if (velocityMatrix.value[id][note] === 0) {
    if (velocity !== 0) {
      addNote(id, note, getNoteVelocity(id, velocity,),);
    }
  } else if (velocity !== velocityMatrix.value[id][note]) {
    removeNote(id, note,);
    if (velocity !== 0) {
      addNote(id, note, getNoteVelocity(id, velocity,),);
    }
  }
  velocityMatrix.value[id][note] = velocity;
};

const kitNumber = ref(0,);
watch(kitNumber, (newValue, oldValue,) => {
  let isResume = false;
  if (isPlaying.value) {
    Tone.Transport.stop();
    isResume = true;
  }
  const samplers = [];
  SamplePresetList[newValue].samplePaths.forEach((samplePath,) => {
    samplers.push(new Tone.Sampler({
      A1: samplePath,
    },).connect(window.volumeChannel,),);
  },);
  window.samplers = samplers;
  const oldLength = SamplePresetList[oldValue].samplePaths.length,
    newLength = SamplePresetList[newValue].samplePaths.length;
  if (newLength > oldLength) {
    for (let i = oldLength; i < newLength; i++) {
      velocityMatrix.value.push(Array(16,).fill(0,),);
    }
  }
  if (newLength < oldLength) {
    for (let i = newLength; i < oldLength; i++) {
      for (let j = 0; j < velocityMatrix.value[i].length; j++) {
        if (velocityMatrix.value[i][j] !== 0)
          Tone.Transport.clear(
            noteEventMap.get(i.toString() + j.toString(),),
          );
      }
    }
    velocityMatrix.value.splice(newLength - oldLength,);
  }
  trackNumber.value = newLength;
  if (isResume) {
    setTimeout(() => {
      Tone.Transport.start();
    }, 400,);
  }
},);
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
        v-for="(kit, index) in SamplePresetList"
        :key="index"
        :label="index"
      >
        {{ kit.name }}
      </el-radio-button>
    </el-radio-group>
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
      @update:value="
        (event) => {
          bpm = event;
        }"
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
      :x-value="filterFrequency"
      :y-value="filterQ"
      x-name="LP Freq"
      y-name="LP Res"
      @update:x-value="(event) => {
        filterFrequency = event;
      }"
      @update:y-value="(event) => {
        filterQ = event;
      }"
    />
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
  <el-footer>
    © 2022
  </el-footer>
</template>

<script>
import * as Tone from 'tone';
import ProbabilityMap from './common/ProbabilityMap.js';
import SamplePresetList from './common/SamplePresetList.js';
import BaseKnob from './components/BaseKnob.vue';
import SequenceTrack from './components/SequenceTrack.vue';
import BaseControlPad from './components/BaseControlPad.vue';

export default {
  components: {
    BaseKnob,
    BaseControlPad,
    SequenceTrack,
  },
  data() {
    return {
      isAudioReady: false,
      gainMap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
      gain: -8,
      bpm: 120,
      swing: 0,
      filterFrequency: 12000,
      filterQ: 1,
      distortion: 0,
      distortionWet: 0,
      delayTime: 0,
      delayFeedback: 0,
    };
  },
  watch: {
    bpm(value,) {
      Tone.Transport.bpm.value = value;
    },
    swing(value,) {
      Tone.Transport.swing = value;
    },
    gain(value,) {
      window.volumeChannel.volume.value = value;
    },
    filterFrequency(value,) {
      window.filterChannel.set({
        frequency: `${value}hz`,
      },);
    },
    filterQ(value,) {
      window.filterChannel.set({
        Q: value,
      },);
    },
    distortion(value,) {
      window.distortionChannel.set({
        distortion: value,
      },);
    },
    distortionWet(value,) {
      window.distortionChannel.set({
        wet: value,
      },);
    },
    delayTime(value,) {
      window.delayChannel.set({
        delayTime: value,
      },);
    },
    delayFeedback(value,) {
      window.delayChannel.set({
        feedback: value,
      },);
    },
  },
  methods: {
    onClickInitButton() {
      Tone.start();
      Tone.Transport.setLoopPoints(0, '1m',);
      Tone.Transport.loop = true;
      this.isAudioReady = true;
    },
    updateGainMap(i, value,) {
      this.gainMap[i] = value;
      window.samplers[i].volume.value = value;
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding-top: 40px;
}

html,
body {
  height: 100%;
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

.control-row,
.kit-row {
  margin: 0 0 20px 0;
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
  font-family: Avenir, Helvetica, Arial, sans-serif;
  border-radius: 14px !important;
  padding: 22px !important;
  word-break: normal;
}
</style>
