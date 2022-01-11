<template>
  <el-card class="box-card">
    <template #header>
      <div class="card-header">
        <span>Sample 0</span>
        <el-button class="button" type="text">Import Sample</el-button>
      </div>
    </template>
    <el-checkbox-group v-model="activeBeats" size="large">
      <el-checkbox-button v-for="beat in sequence" :key="beat" :label="beat">
        {{ beat }}
      </el-checkbox-button>
    </el-checkbox-group>
  </el-card>
</template>

<script setup>
</script>

<script>
export default {
  name: "SequenceTrack",
  emits: ["addNote", "removeNote"],
  props: {
    length: Number,
  },
  data() {
    return {
      activeBeats: [],
    };
  },
  computed: {
    sequence() {
      return [...Array(this.length).keys()];
    },
  },
  watch: {
    activeBeats(newValue, oldValue) {
      const newBeats = newValue.filter(x => !oldValue.includes(x));
      const oldBeats = oldValue.filter(x => !newValue.includes(x));
      for (const beat of newBeats) {
        this.$emit("addNote", beat);
      }
      for (const beat of oldBeats) {
        this.$emit("removeNote", beat);
      }
    }
  }
};
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>