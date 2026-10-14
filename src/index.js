'use strict';

const { add } = require('./math');

// 应用入口：演示 src 下多文件组织，构建时会被一起打包进 dist/
function main() {
  const result = add(1, 2);
  console.log(`1 + 2 = ${result}`);
  return result;
}

// 仅在被直接执行时运行；被 require 时不自动执行（方便测试/复用）
if (require.main === module) {
  main();
}

module.exports = { main };
