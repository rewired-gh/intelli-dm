<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import SequenceTrack from "./components/SequenceTrack.vue";
import BaseKnob from "./components/BaseKnob.vue";

window.addEventListener('click', async () => {
  await Tone.start();
});

Tone.Transport.setLoopPoints(0, "1m");
Tone.Transport.loop = true;

const sampler = new Tone.Sampler({
  A1: "/kick-808x-1.wav",
}).toDestination();
</script>

<template>
  <el-row class="control-row" justify="center">
    <el-button id="playButton" :type="playButtonType" round size="large" @click="togglePlayButton">
      {{ playButtonText }}
    </el-button>
    <base-knob v-model:value="bpm" :max-rotation-turn="1.35" :max-value="250" :min-value="40" display-name="BPM"
    ></base-knob>
  </el-row>
  <sequence-track :length="16" @add-note="addNote" @remove-note="removeNote"></sequence-track>
</template>

<script>
import * as Tone from "tone";

export default {
  data() {
    return {
      isPlaying: false,
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
    }
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
    addNote(note) {
      const event = Tone.Transport.schedule((time) => {
        this.sampler.triggerAttackRelease("A1", 1, time, 0.8);
      }, "0:0:" + note);
      this.noteEventMap.set(note, event);
    },
    removeNote(note) {
      Tone.Transport.clear(this.noteEventMap.get(note));
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
  margin-top: 60px;
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
