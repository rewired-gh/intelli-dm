<template>
  <div class="knob-wrapper">
    <div
      :class="{ compact: isCompact, grabbing: isGrabbing }"
      :style="style"
      class="knob-body"
      tabindex="0"
      @mouseleave="isHover = isGrabbing"
      @mouseover="isHover = true"
      @mousedown.left="onMouseDown"
      @touchstart.prevent="onTouchStart"
      @wheel.prevent="onWheelChange"
      @keydown.up.prevent="onArrowUp"
      @keydown.down.prevent="onArrowDown"
      @contextmenu.prevent="onRightClick"
    >
      <img
        alt="knob"
        src="../assets/knob.svg"
      >
    </div>
    <div
      v-show="!isHover"
      :class="{ compact: isCompact }"
      class="knob-label"
    >
      {{ displayName }}
    </div>
    <div
      v-show="isHover"
      :class="{ compact: isCompact }"
      class="knob-label"
    >
      {{ displayValue }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'BaseKnob',
  props: {
    value: {
      type: Number,
      required: true
    },
    minValue: {
      type: Number,
      default: 0,
      required: false
    },
    maxValue: {
      type: Number,
      default: 100,
      required: false
    },
    maxRotationTurn: {
      type: Number,
      default: 0.35,
      required: false
    },
    minRotationTurn: {
      type: Number,
      default: -0.35,
      required: false
    },
    speed: {
      type: Number,
      default: 0.5,
      required: false
    },
    precision: {
      type: Number,
      default: 1,
      required: false
    },
    displayName: {
      type: String,
      required: true
    },
    isValueHidden: {
      type: Boolean,
      default: false,
      required: false
    },
    isCompact: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  emits: ['update:value'],
  data() {
    return {
      lastValue: 0,
      initialY: 0,
      isGrabbing: false,
      isHover: false,
      defaultValue: 0
    }
  },
  computed: {
    displayValue() {
      return this.value.toFixed(this.precision)
    },
    rotationTurn() {
      return (
        ((this.maxRotationTurn - this.minRotationTurn)
          * ((this.value - this.minValue)
            / (this.maxValue - this.minValue)))
        + this.minRotationTurn
      )
    },
    style() {
      return {
        transform: `rotate(${this.rotationTurn}turn)`
      }
    }
  },
  beforeMount() {
    this.defaultValue = this.value
  },
  methods: {
    onRightClick() {
      this.$emit('update:value', this.defaultValue)
    },
    onMouseDown(event) {
      this.lastValue = this.value
      this.initialY = event.clientY
      this.isGrabbing = true
      document.body.style.cursor = 'grabbing'
      window.addEventListener('mousemove', this.onMouseMove)
      window.addEventListener('mouseup', this.onMouseUp)
    },
    onTouchStart(event) {
      this.lastValue = this.value
      this.initialY = event.touches[0].clientY
      window.addEventListener('touchmove', this.onTouchMove)
      window.addEventListener('touchend', this.onTouchEnd)
    },
    onMouseUp() {
      this.isGrabbing = false
      this.isHover = false
      document.body.style.cursor = 'default'
      window.removeEventListener('mousemove', this.onMouseMove)
      window.removeEventListener('mouseup', this.onMouseUp)
    },
    onTouchEnd() {
      window.removeEventListener('touchmove', this.onTouchMove)
      window.removeEventListener('mouseup', this.onTouchEnd)
    },
    onMouseMove(event) {
      this.$emit('update:value', this.getValidValue(this.lastValue
        - ((event.clientY - this.initialY) * this.speed)))
    },
    onTouchMove(event) {
      event.preventDefault()
      this.$emit('update:value', this.getValidValue(this.lastValue
        - ((event.touches[0].clientY - this.initialY) * this.speed)))
    },
    onWheelChange($event) {
      this.$emit('update:value', this.getValidValue(this.value
        + ($event.deltaY * this.speed * 0.1)))
    },
    onArrowUp() {
      this.$emit('update:value', this.getValidValue(this.value
        + this.speed))
    },
    onArrowDown() {
      this.$emit('update:value', this.getValidValue(this.value
        - this.speed))
    },
    getValidValue(value) {
      if (value > this.maxValue) {
        return this.maxValue
      } else if (value < this.minValue) {
        return this.minValue
      }
      return value
    }
  }

}

</script>

<style scoped>
* {
  font-size: 14px;
}

.compact {
  font-size: 10px;
}

.knob-body {
  height: 40px;
  width: 40px;
  margin: auto;
  outline: none;
}

.knob-body.compact {
  height: 30px;
  width: 30px;
}

.knob-body > * {
  pointer-events: none;
}

.knob-body:hover {
  cursor: grab;
}

.knob-body.grabbing:hover {
  cursor: grabbing;
}

.knob-body:focus {
  border: none;
}

.knob-body:focus, .knob-body:hover {
  transition: filter 0.2s ease-out;
  filter: brightness(110%);
}

.knob-label {
  margin: 4px 0 0 0;
}

.knob-label.compact {
  margin: 2px 0 0 0;
}
</style>
