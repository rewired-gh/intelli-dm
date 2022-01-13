<script setup>
window.volumeChannel = new Tone.Volume(-8).toDestination();

window.samplers = [
  new Tone.Sampler({
    A1: '/samples/kick-808x-1.aac',
  }).connect(window.volumeChannel),
  new Tone.Sampler({
    A1: '/samples/clap-808x.aac',
  }).connect(window.volumeChannel),
  new Tone.Sampler({
    A1: '/samples/snare-808x-1.aac',
  }).connect(window.volumeChannel),
  new Tone.Sampler({
    A1: '/samples/closed-hh-808x.aac',
  }).connect(window.volumeChannel),
  new Tone.Sampler({
    A1: '/samples/open-hh-808x.aac',
  }).connect(window.volumeChannel),
  new Tone.Sampler({
    A1: '/samples/shaker-808x.aac',
  }).connect(window.volumeChannel),
  new Tone.Sampler({
    A1: '/samples/crash-808x.aac',
  }).connect(window.volumeChannel),
  new Tone.Sampler({
    A1: '/samples/hi-tom-808x.aac',
  }).connect(window.volumeChannel),
  new Tone.Sampler({
    A1: '/samples/mid-hi-tom-808x.aac',
  }).connect(window.volumeChannel),
  new Tone.Sampler({
    A1: '/samples/low-tom-808x.aac',
  }).connect(window.volumeChannel),
  new Tone.Sampler({
    A1: '/samples/mid-low-tom-808x.aac',
  }).connect(window.volumeChannel),
];
</script>

<template>
  <el-row class="control-row" justify="center">
    <el-button
      :disabled="isAudioReady"
      round
      size="large"
      type="primary"
      @click="toggleInitButton"
    >
      Init
    </el-button>
    <el-button
      :disabled="!isAudioReady"
      :type="playButtonType"
      round
      size="large"
      @click="togglePlayButton"
    >
      {{ playButtonText }}
    </el-button>
    <el-button round size="large" type="warning" @click="toggleShuffleButton">
      Shuffle
    </el-button>
    <el-button round size="large" type="danger" @click="toggleClearButton">
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
        }
      "
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
  <el-row v-for="i in trackNumber" :key="i - 1" justify="center">
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
import BaseKnob from './components/BaseKnob';
import SequenceTrack from './components/SequenceTrack';

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
      probabilityMap: [
        [
          0.9, 0.05, 0.1, 0.05, 0.4, 0.05, 0.1, 0.05, 0.9, 0.05, 0.1, 0.05, 0.4,
          0.05, 0.1, 0.05,
        ],
        [
          0.05, 0.05, 0.05, 0.05, 0.4, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
          0.4, 0.05, 0.05, 0.05,
        ],
        [
          0.05, 0.05, 0.2, 0.05, 0.7, 0.05, 0.2, 0.05, 0.05, 0.05, 0.2, 0.05,
          0.7, 0.05, 0.2, 0.05,
        ],
        [
          0.2, 0.08, 0.5, 0.08, 0.2, 0.08, 0.5, 0.08, 0.2, 0.08, 0.5, 0.08, 0.2,
          0.08, 0.5, 0.08,
        ],
        [
          0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
          0.05, 0.05, 0.05, 0.05, 0.05,
        ],
        [
          0.7, 0.1, 0.4, 0.1, 0.7, 0.1, 0.4, 0.1, 0.7, 0.1, 0.4, 0.1, 0.7, 0.1,
          0.4, 0.1,
        ],
        [0.01, 0, 0, 0, 0.01, 0, 0, 0, 0.01, 0, 0, 0, 0.01, 0, 0, 0],
        [
          0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
          0.05, 0.05, 0.05, 0.05, 0.05,
        ],
        [
          0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
          0.05, 0.05, 0.05, 0.05, 0.05,
        ],
        [
          0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
          0.05, 0.05, 0.05, 0.05, 0.05,
        ],
        [
          0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
          0.05, 0.05, 0.05, 0.05, 0.05,
        ],
      ],
      gainMap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      gain: -8,
      velocityMatrix: Array.from(Array(_trackNumber), () => Array(16).fill(0)),
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
    bpm(value) {
      Tone.Transport.bpm.value = value;
    },
    swing(value) {
      Tone.Transport.swing = value;
    },
    gain(value) {
      window.volumeChannel.volume.value = value;
    },
  },
  methods: {
    calculateVelocity(id, velocity) {
      const maxVelocity = 0.8;
      const minVelocity = 0;
      return (
        (velocity / this.maxVelocity) * (maxVelocity - minVelocity) +
        minVelocity
      );
    },
    togglePlayButton() {
      if (this.isPlaying) {
        Tone.Transport.stop();
      } else {
        Tone.Transport.start();
      }
      this.isPlaying = !this.isPlaying;
    },
    toggleInitButton() {
      Tone.start();
      Tone.Transport.setLoopPoints(0, '1m');
      Tone.Transport.loop = true;
      this.isAudioReady = true;
    },
    toggleShuffleButton() {
      Tone.Transport.cancel();
      let newVelocityMatrix = Array.from(Array(this.trackNumber), () =>
        Array(16).fill(0)
      );
      for (let i = 0; i < newVelocityMatrix.length; i++) {
        for (let j = 0; j < newVelocityMatrix[i].length; j++) {
          if (Math.random() < this.probabilityMap[i][j]) {
            newVelocityMatrix[i][j] = this.maxVelocity;
            this.addNote(
              i,
              j,
              this.calculateVelocity(i, newVelocityMatrix[i][j])
            );
          } else {
            newVelocityMatrix[i][j] = 0;
          }
        }
      }
      this.velocityMatrix = newVelocityMatrix;
    },
    updateGainMap(i, value) {
      this.gainMap[i] = value;
      window.samplers[i].volume.value = value;
    },
    addNote(id, note, velocity) {
      const event = Tone.Transport.schedule((time) => {
        window.samplers[id].triggerAttackRelease('A1', 3, time, velocity);
      }, '0:0:' + note);
      this.noteEventMap.set(id.toString() + note.toString(), event);
    },
    toggleClearButton() {
      this.velocityMatrix = Array.from(Array(this.trackNumber), () =>
        Array(16).fill(0)
      );
      Tone.Transport.cancel();
    },
    removeNote(id, note) {
      Tone.Transport.clear(
        this.noteEventMap.get(id.toString() + note.toString())
      );
    },
    updateVelocity(id, note, velocity) {
      if (this.velocityMatrix[id][note] === 0) {
        if (velocity !== 0) {
          this.addNote(id, note, this.calculateVelocity(id, velocity));
        }
      } else if (velocity !== this.velocityMatrix[id][note]) {
        this.removeNote(id, note);
        if (velocity !== 0) {
          this.addNote(id, note, this.calculateVelocity(id, velocity));
        }
      }
      this.velocityMatrix[id][note] = velocity;
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

* {
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
</style>
