<script setup>

import samplesPathList from './common/SamplesPathList.js';

window.volumeChannel = new Tone.Volume(-8,).toDestination();

const samplers = [];

samplesPathList.forEach((samplePath,) => {
  samplers.push(new Tone.Sampler({
    A1: samplePath,
  },).connect(window.volumeChannel,),);
},);

window.samplers = samplers;
</script>

<template>
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
      @update:value="(event) => {bpm = event;}"
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
      @update:value="(event) => updateGainMap(i - 1, event)"
    />
  </el-row>
</template>

<script>
import * as Tone from 'tone';
import ProbabilityMap from './common/ProbabilityMap.js';
import BaseKnob from './components/BaseKnob.vue';
import SequenceTrack from './components/SequenceTrack.vue';

export default {
  components: {
    BaseKnob,
    SequenceTrack,
  },
  data() {
    const _trackNumber = 11;

    return {
      trackNumber: _trackNumber,
      isPlaying: false,
      isAudioReady: false,
      noteEventMap: new Map(),
      probabilityMap: ProbabilityMap,
      gainMap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
      gain: -8,
      velocityMatrix: Array.from(Array(_trackNumber,),
        () => Array(16,).fill(0,),),
      bpm: 120,
      swing: 0,
      maxVelocity: 3,
    };
  },
  computed: {
    playButtonType() {
      return this.isPlaying ? 'danger' : 'success';
    },
    playButtonText() {
      return this.isPlaying ? 'Stop' : 'Play';
    },
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
  },
  methods: {
    onClickPlayButton() {
      if (this.isPlaying) {
        Tone.Transport.stop();
      } else {
        Tone.Transport.start();
      }
      this.isPlaying = !this.isPlaying;
    },
    onClickInitButton() {
      Tone.start();
      Tone.Transport.setLoopPoints(0, '1m',);
      Tone.Transport.loop = true;
      this.isAudioReady = true;
    },
    onClickShuffleButton() {
      Tone.Transport.cancel();
      let newVelocityMatrix = Array.from(Array(this.trackNumber,), () =>
        Array(16,).fill(0,),
      );
      for (let i = 0; i < newVelocityMatrix.length; i++) {
        for (let j = 0; j < newVelocityMatrix[i].length; j++) {
          if (Math.random() < this.probabilityMap[i][j]) {
            newVelocityMatrix[i][j] = this.maxVelocity;
            this.addNote(
              i,
              j,
              this.getNoteVelocity(i, newVelocityMatrix[i][j],),
            );
          } else {
            newVelocityMatrix[i][j] = 0;
          }
        }
      }
      this.velocityMatrix = newVelocityMatrix;
    },
    onClickClearButton() {
      this.velocityMatrix = Array.from(Array(this.trackNumber,), () =>
        Array(16,).fill(0,),
      );
      Tone.Transport.cancel();
    },
    getNoteVelocity(id, velocity,) {
      const maxVelocity = 0.8;
      const minVelocity = 0;
      return ((velocity / this.maxVelocity) * (maxVelocity - minVelocity))
        + minVelocity;
    },
    updateGainMap(i, value,) {
      this.gainMap[i] = value;
      window.samplers[i].volume.value = value;
    },
    updateVelocity(id, note, velocity,) {
      if (this.velocityMatrix[id][note] === 0) {
        if (velocity !== 0) {
          this.addNote(id, note, this.getNoteVelocity(id, velocity,),);
        }
      } else if (velocity !== this.velocityMatrix[id][note]) {
        this.removeNote(id, note,);
        if (velocity !== 0) {
          this.addNote(id, note, this.getNoteVelocity(id, velocity,),);
        }
      }
      this.velocityMatrix[id][note] = velocity;
    },
    addNote(id, note, velocity,) {
      const event = Tone.Transport.schedule((time,) => {
        window.samplers[id].triggerAttackRelease('A1', 3, time, velocity,);
      }, '0:0:' + note,);
      this.noteEventMap.set(id.toString() + note.toString(), event,);
    },
    removeNote(id, note,) {
      Tone.Transport.clear(
        this.noteEventMap.get(id.toString() + note.toString(),),
      );
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
  padding-top: 60px;
}

html,
body {
  height: 100%;
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
