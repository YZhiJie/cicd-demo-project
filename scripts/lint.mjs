#!/usr/bin/env node
// 零依赖 lint 脚本：不引入 ESLint 是为了让示例项目离线可跑、CI 更快。
// 真实项目可平滑替换为 ESLint：npm i -D eslint && 把本脚本换成 eslint .
//
// 检查规则（全部失败时以非零退出码结束，CI 会据此判定 job 失败）：
//   1. 语法检查：node --check（等价 ESLint 的 parser 层）
//   2. 禁止残留 debugger 语句
//   3. 文件必须以换行符结尾（POSIX 文本规范，也避免某些工具告警）

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["src", "test", "scripts"];
const EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);

function collectFiles(dir) {
  const result = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      result.push(...collectFiles(full));
    } else if (EXTENSIONS.has(extname(entry))) {
      result.push(full);
    }
  }
  return result;
}

const errors = [];
const files = ROOTS.flatMap((dir) => {
  try {
    return collectFiles(dir);
  } catch {
    console.warn(`[lint] 跳过不存在的目录: ${dir}`);
    return [];
  }
});

for (const file of files) {
  // 规则 1：语法检查
  const syntax = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  if (syntax.status !== 0) {
    errors.push(`[语法错误] ${file}\n${syntax.stderr.trim()}`);
    continue; // 语法已坏，后续文本规则没有意义
  }

  const content = readFileSync(file, "utf8");

  // 规则 2：禁止 debugger 语句
  // 用语句边界匹配（行首/分号/花括号之后、分号/行尾/花括号之前），
  // 避免误报字符串或正则文本中出现的 debugger 字样——本文件自身就含该词。
  const codeLines = content
    .split("\n")
    .filter((line) => !/^\s*(\/\/|#|\*)/.test(line))
    .join("\n");
  const debuggerStatement = /(^|[;{}\n])[ \t]*debugger[ \t]*(?=[;\n}])/m;
  if (debuggerStatement.test(codeLines)) {
    errors.push(`[规则] ${file}: 不允许保留 debugger 语句`);
  }

  // 规则 3：文件以换行结尾
  if (!content.endsWith("\n")) {
    errors.push(`[格式] ${file}: 文件末尾需要一个换行符`);
  }
}

if (errors.length > 0) {
  console.error(`[lint] 检查失败，共 ${errors.length} 个问题：\n`);
  for (const e of errors) console.error(`- ${e}\n`);
  process.exit(1);
}

console.log(`[lint] 通过：检查了 ${files.length} 个文件，0 个问题`);
