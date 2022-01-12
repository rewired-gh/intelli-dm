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
    id: String,
  },
  data() {
    return {
      // activeBeats: [],
      sequence: [...Array(this.length).keys()],
      beatVelocities: new Array(this.length).fill(0),
      maxVelocity: 3,
    };
  },
  watch: {},
  methods: {
    calculateVelocity(velocity) {
      const maxVelocity = 0.8;
      const minVelocity = 0.1;
      return (
        (velocity / this.maxVelocity) * (maxVelocity - minVelocity) +
        minVelocity
      );
    },
    toggleBeat(beat) {
      if (this.beatVelocities[beat] === 0) {
        this.beatVelocities[beat] = this.maxVelocity;
        this.$emit(
          "addNote",
          this.id,
          beat,
          this.calculateVelocity(this.beatVelocities[beat])
        );
      } else if (this.beatVelocities[beat] === 1) {
        this.$emit("removeNote", this.id, beat);
        this.beatVelocities[beat]--;
      } else {
        this.beatVelocities[beat]--;
        this.$emit("removeNote", this.id, beat);
        this.$emit(
          "addNote",
          this.id,
          beat,
          this.calculateVelocity(this.beatVelocities[beat])
        );
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
  margin: 5px;
}

.beat {
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 32px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid #409eff;
  box-shadow: rgba(0, 0, 0, 0.1) 0 1px 3px 0, rgba(0, 0, 0, 0.06) 0 1px 2px 0;
  overflow: hidden;
}

.beat:hover {
  box-shadow: rgba(0, 0, 0, 0.1) 0 4px 6px -1px,
    rgba(0, 0, 0, 0.06) 0 2px 4px -1px;
  background-color: #409eff08;
  transform: translateY(-1px);
  cursor: pointer;
}

.beat-content {
  width: inherit;
  height: 50%;
  background-color: #409eff;
}
</style>
