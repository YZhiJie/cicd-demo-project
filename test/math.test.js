'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { add, subtract, divide } = require('../src/math');

// 对应教程 L2：最基础的自动化测试，CI 的 test 步骤执行本文件
test('add：两数相加', () => {
  assert.equal(add(1, 2), 3);
  assert.equal(add(-1, 1), 0);
});

test('subtract：两数相减', () => {
  assert.equal(subtract(5, 3), 2);
});

test('divide：正常除法', () => {
  assert.equal(divide(6, 3), 2);
});

test('divide：除数为 0 时抛出明确错误', () => {
  assert.throws(() => divide(1, 0), /除数不能为 0/);
});
