<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import SequenceTrack from "./components/SequenceTrack.vue";
import BaseKnob from "./components/BaseKnob.vue";

// window.addEventListener("click", async () => {
//   await Tone.start();
// });
//
// Tone.Transport.setLoopPoints(0, "1m");
// Tone.Transport.loop = true;

const samplers = [
  new Tone.Sampler({
    A1: "/kick-808x-1.wav",
    B1: "/clap-808x.wav",
    C1: "/snare-808x-1.wav",
    D1: "/closed-hh-808x.wav",
    E1: "/open-hh-808x.wav",
    F1: "/shaker-808x.wav",
    G1: "/crash-808x.wav",
  }).toDestination(),
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
    <base-knob
      v-model:value="bpm"
      :max-rotation-turn="1.35"
      :max-value="250"
      :min-value="40"
      display-name="BPM"
    ></base-knob>
  </el-row>
  <sequence-track
    id="A1"
    :length="16"
    @add-note="addNote"
    @remove-note="removeNote"
  ></sequence-track>
  <sequence-track
    id="B1"
    :length="16"
    @add-note="addNote"
    @remove-note="removeNote"
  ></sequence-track>
  <sequence-track
    id="C1"
    :length="16"
    @add-note="addNote"
    @remove-note="removeNote"
  ></sequence-track>
  <sequence-track
    id="D1"
    :length="16"
    @add-note="addNote"
    @remove-note="removeNote"
  ></sequence-track>
  <sequence-track
    id="E1"
    :length="16"
    @add-note="addNote"
    @remove-note="removeNote"
  ></sequence-track>
  <sequence-track
    id="F1"
    :length="16"
    @add-note="addNote"
    @remove-note="removeNote"
  ></sequence-track>
  <sequence-track
    id="G1"
    :length="16"
    @add-note="addNote"
    @remove-note="removeNote"
  ></sequence-track>
</template>

<script>
import * as Tone from "tone";

export default {
  data() {
    return {
      isPlaying: false,
      isAudioReady: false,
      noteEventMap: new Map(),
      bpm: 120,
    };
  },
  computed: {
    playButtonType() {
      return this.isPlaying ? "danger" : "success";
    },
    playButtonText() {
      return this.isPlaying ? "Stop" : "Play";
    },
  },
  watch: {
    bpm(value) {
      Tone.Transport.bpm.value = value;
    },
  },
  methods: {
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
      Tone.Transport.setLoopPoints(0, "1m");
      Tone.Transport.loop = true;
      this.isAudioReady = true;
    },
    addNote(id, note, velocity) {
      const event = Tone.Transport.schedule((time) => {
        this.samplers[0].triggerAttackRelease(id, 4, time, velocity);
      }, "0:0:" + note);
      this.noteEventMap.set([id, note], event);
    },
    removeNote(id, note) {
      Tone.Transport.clear(this.noteEventMap.get([id, note]));
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
  margin: 0 10px;
}

.control-row {
  margin: 0 0 20px 0;
}
</style>