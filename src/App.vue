<script setup>
</script>

<template>
  <router-view />
  <el-footer>
    「过程淘汰」· All Rights Reserved · © 2022
  </el-footer>
</template>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding-top: 40px;
}

html,
body {
  height: 100%;
  width: 100%;
}

.el-footer {
  font-size: 12px;
  margin: 80px 0;
}

ul {
  padding: 0 0 0 16px;
  margin: 0;
  word-break: normal;
}

*:not(input) {
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Old versions of Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none;
}

.el-row > * {
  margin: 0 20px;
}

.el-popover {
  border-radius: 14px !important;
  padding: 22px !important;
  word-break: normal;
}

body, #app, .el-row, .el-popover, .el-button {
  font-family: Ruda, Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.el-input-number {
  line-height: 100% !important;
}

.el-radio-button__inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/*.el-input, .el-input-number {*/
/*  -webkit-user-select: text;*/
/*}*/
</style>
