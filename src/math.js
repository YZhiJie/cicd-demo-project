"use strict";

// 数学工具函数：示例项目的被测对象
// 设计决策：函数刻意保持简单，重点是让 CI 流程（lint/test/build）有真实内容可跑

/**
 * 两数相加
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function add(a, b) {
  return a + b;
}

/**
 * 两数相减
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function subtract(a, b) {
  return a - b;
}

/**
 * 两数相除；除数为 0 时抛错（测试用例专门覆盖这条分支）
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function divide(a, b) {
  if (b === 0) {
    throw new Error("除数不能为 0");
  }
  return a / b;
}

module.exports = { add, subtract, divide };
