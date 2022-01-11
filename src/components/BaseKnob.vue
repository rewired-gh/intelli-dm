<template>
  <div class="knob-wrapper">
    <div :style="style" class="knob-body" @mousedown="mouseDown"><img alt="knob" src="../assets/knob.svg"/></div>
    <div class="knob-value">{{ displayValue }}</div>
  </div>
</template>

<script>
export default {
  name: "BaseKnob",
  props: {
    value: {
      type: Number,
      required: true,
    },
    minValue: {
      type: Number,
      default: 0,
      required: false,
    },
    maxValue: {
      type: Number,
      default: 100,
      required: false,
    },
    maxRotationTurn: {
      type: Number,
      default: 0.35,
      required: false,
    },
    minRotationTurn: {
      type: Number,
      default: -0.35,
      required: false,
    },
    speed: {
      type: Number,
      default: 0.5,
      required: false,
    }
  },
  data() {
    return {
      lastValue: 0,
      initialY: 0,
    };
  },
  computed: {
    displayValue() {
      return this.value.toFixed(1);
    },
    rotationTurn() {
      return ((this.maxRotationTurn - this.minRotationTurn) * ((this.value - this.minValue) / (this.maxValue - this.minValue)) + this.minRotationTurn);
    },
    style() {
      return {
        transform: "rotate(" + this.rotationTurn + "turn)",
      };
    },
  },
  methods: {
    mouseDown(event) {
      this.lastValue = this.value;
      this.initialY = event.clientY;
      window.addEventListener("mousemove", this.mouseMove);
      window.addEventListener("mouseup", this.mouseUp);
    },
    mouseUp() {
      window.removeEventListener("mousemove", this.mouseMove);
      window.removeEventListener("mouseup", this.mouseUp);
    },
    mouseMove(event) {
      const newValue = this.lastValue - (event.clientY - this.initialY) * this.speed;
      if (newValue > this.maxValue) {
        this.$emit("update:value", this.maxValue);
      } else if (newValue < this.minValue) {
        this.$emit("update:value", this.minValue);
      } else {
        this.$emit("update:value", newValue);
      }
    },
  },
}
</script>

<style scoped>
.knob-body {
  height: 36px;
  width: 36px;
  margin: auto;
}

.knob-body > * {
  pointer-events: none;
}

.knob-value {
  margin: 4px 0 0 0;
  font-size: 14px;
}
</style>