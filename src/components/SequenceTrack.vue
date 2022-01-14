<template>
  <el-row
    :gutter="20"
    justify="center"
  >
    <div
      v-for="beat in sequence"
      :key="beat"
      class="beat"
      @click="onClickBeat(beat)"
      @mousedown.right="onRightClickBeat(beat)"
      @contextmenu.prevent
    >
      <div
        :style="getBeatContentStyle(beat)"
        class="beat-content"
      />
    </div>
  </el-row>
</template>

<script>
export default {
  name: 'SequenceTrack',
  props: {
    length: { type: Number, default: 16, },
    id: { type: Number, default: 0, },
    beatVelocities: { type: Array, default: null, },
    maxVelocity: { type: Number, default: 3, },
  },
  emits: ['updateVelocity',],
  data() {
    return {
      sequence: [...Array(this.length,).keys(),],
    };
  },
  methods: {
    onClickBeat(beat,) {
      if (this.beatVelocities[beat] === 0) {
        this.$emit('updateVelocity', this.id, beat, this.maxVelocity,);
      } else {
        this.$emit(
          'updateVelocity',
          this.id,
          beat,
          this.beatVelocities[beat] - 1,
        );
      }
    },
    onRightClickBeat(beat,) {
      this.$emit('updateVelocity', this.id, beat, 0,);
    },
    getBeatContentStyle(beat,) {
      return {
        height: ((100 * this.beatVelocities[beat]) / this.maxVelocity) + '%',
      };
    },
  },
};
</script>

<style lang='scss' scoped>
$primary-color: #409eff;
$primary-light-color: #409eff10;

* {
  transition: all 0.2s ease-out;
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
  border: 1px solid $primary-color;
  box-shadow: rgba(0, 0, 0, 0.1) 0 1px 3px 0, rgba(0, 0, 0, 0.06) 0 1px 2px 0;
  overflow: hidden;
}

.beat:hover {
  box-shadow: rgba(0, 0, 0, 0.1) 0 4px 6px -1px,
  rgba(0, 0, 0, 0.06) 0 2px 4px -1px;
  //background-color: $primary-light-color;
  transform: translateY(-2px);
  cursor: pointer;
}

.beat-content {
  width: inherit;
  height: 50%;
  background-color: $primary-color;
}
</style>
