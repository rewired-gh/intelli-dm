<template>
  <div class="wrapper">
    <div class="left-text">
      {{ yName }}
    </div>
    <div class="pad">
      <div
        ref="space"
        class="pad-content"
      >
        <div
          id="ball"
          ref="ball"
          :style="style"
          @mousedown="onMouseDown"
          @touchstart.prevent="onTouchStart"
        />
      </div>
    </div>
    <div />
    <div>
      {{ xName }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'BaseControlPad',
  props: {
    xName: {
      type: String,
      required: true,
    },
    yName: {
      type: String,
      required: true,
    },
    xValue: {
      type: Number,
      required: true,
    },
    yValue: {
      type: Number,
      required: true,
    },
    minXValue: {
      type: Number,
      default: 0,
      required: false,
    },
    maxXValue: {
      type: Number,
      default: 100,
      required: false,
    },
    minYValue: {
      type: Number,
      default: 0,
      required: false,
    },
    maxYValue: {
      type: Number,
      default: 100,
      required: false,
    },
    precision: {
      type: Number,
      default: 1,
      required: false,
    },
  },
  emits: ['update:xValue', 'update:yValue',],
  computed: {
    positionX() {
      return (
        120 * ((this.xValue - this.minXValue)
          / (this.maxXValue - this.minXValue))
      );
    },
    positionY() {
      return (
        120 * (1 - ((this.yValue - this.minYValue)
          / (this.maxYValue - this.minYValue)))
      );
    },
    style() {
      return {
        transform: `translate(calc(${this.positionX}px - 50%),
        calc(${this.positionY}px - 50%))`,
      };
    },
  },
  methods: {
    onMouseDown() {
      document.body.style.cursor = 'grab';
      window.addEventListener('mousemove', this.onMouseMove,);
      window.addEventListener('mouseup', this.onMouseUp,);
    },
    onTouchStart() {
      window.addEventListener('touchmove', this.onTouchMove,);
      window.addEventListener('touchend', this.onTouchEnd,);
    },
    onMouseUp() {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', this.onMouseMove,);
      window.removeEventListener('mouseup', this.onMouseUp,);
    },
    onTouchEnd() {
      window.removeEventListener('touchmove', this.onTouchMove,);
      window.removeEventListener('mouseup', this.onTouchEnd,);
    },
    onMouseMove(event,) {
      const spaceRect = this.$refs.space.getBoundingClientRect();
      this.$emit('update:xValue', this.getValidXValue(
        ((event.clientX - spaceRect.left) / spaceRect.width
          * (this.maxXValue - this.minXValue)) + this.minXValue,),);
      this.$emit('update:yValue', this.getValidYValue(
        ((1 - ((event.clientY - spaceRect.top) / spaceRect.width))
          * (this.maxYValue - this.minYValue)) + this.minYValue,),);
    },
    onTouchMove(event,) {
      event.preventDefault();
      const spaceRect = this.$refs.space.getBoundingClientRect();
      this.$emit('update:xValue', this.getValidXValue(
        ((event.clientX - spaceRect.left) / spaceRect.width
          * (this.maxXValue - this.minXValue)) + this.minXValue,),);
      this.$emit('update:yValue', this.getValidYValue(
        ((1 - ((event.clientY - spaceRect.top) / spaceRect.width))
          * (this.maxYValue - this.minYValue)) + this.minYValue,),);
    },
    getValidXValue(value,) {
      if (value > this.maxXValue) {
        return this.maxXValue;
      } else if (value < this.minXValue) {
        return this.minXValue;
      }
      return value;
    },
    getValidYValue(value,) {
      if (value > this.maxYValue) {
        return this.maxYValue;
      } else if (value < this.minYValue) {
        return this.minYValue;
      }
      return value;
    },
  },
};
</script>

<style scoped>
.wrapper {
  display: grid;
  grid-gap: 5px;
  grid-template-columns: 20px 160px;
  grid-template-rows: 160px 20px;
  background-color: white;
  font-size: 14px;
}

.left-text {
  writing-mode: vertical-rl;
}

.pad {
  border-radius: 19px;
  border: 1px solid #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pad-content {
  width: 120px;
  height: 120px;
}

#ball {
  background-color: #409eff;
  border-radius: 10px;
  width: 18px;
  height: 18px;
}

#ball:hover {
  cursor: grab;
}

#ball:focus {
  border: none;
}
</style>
