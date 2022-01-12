<template>
  <el-row :gutter="20" justify="center">
    <div
      v-for="beat in sequence"
      class="beat"
      @click="toggleBeat(beat)"
      @mousedown.right="rightClickBeat(beat)"
      @contextmenu.prevent
    >
      <div :style="this.beatContentStyle(beat)" class="beat-content"></div>
    </div>
  </el-row>
</template>

<script setup></script>

<script>
export default {
  name: "SequenceTrack",
  emits: ["addNote", "removeNote"],
  props: {
    length: Number,
    id: Number,
  },
  data() {
    return {
      // activeBeats: [],
      sequence: [...Array(this.length).keys()],
      beatVelocities: new Array(this.length).fill(0),
      maxVelocity: 3,
    };
  },
  watch: {
    // activeBeats(newValue, oldValue) {
    //   const newBeats = newValue.filter((x) => !oldValue.includes(x));
    //   const oldBeats = oldValue.filter((x) => !newValue.includes(x));
    //   for (const beat of newBeats) {
    //     this.$emit("addNote", this.id, beat);
    //   }
    //   for (const beat of oldBeats) {
    //     this.$emit("removeNote", this.id, beat);
    //   }
    // },
  },
  methods: {
    toggleBeat(beat) {
      if (this.beatVelocities[beat] === 0) {
        this.$emit("addNote", this.id, beat);
        this.beatVelocities[beat] = this.maxVelocity;
      } else if (this.beatVelocities[beat] === 1) {
        this.$emit("removeNote", this.id, beat);
        this.beatVelocities[beat]--;
      } else {
        this.beatVelocities[beat]--;
      }
    },
    rightClickBeat(beat) {
      this.beatVelocities[beat] = 0;
      this.$emit("removeNote", this.id, beat);
    },
    beatContentStyle(beat) {
      return {
        height: (100 * this.beatVelocities[beat]) / this.maxVelocity + "%",
      };
    },
  },
};
</script>

<style scoped>
* {
  transition: all 0.1s ease-out;
}

.el-row > * {
  margin: 0 5px;
}

.beat {
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 32px;
  height: 38px;
  border-radius: 12px;
  border: 2px solid #409eff;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px,
    rgba(0, 0, 0, 0.06) 0px 1px 2px 0px;
  overflow: hidden;
}

.beat:hover {
  box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px,
    rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
  cursor: pointer;
}

.beat-content {
  width: inherit;
  height: 50%;
  background-color: #409eff;
}
</style>
