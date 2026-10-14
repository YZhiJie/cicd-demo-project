#!/usr/bin/env bash
# 构建脚本：把 src/ 打包到 dist/，并写入构建元信息。
# 关键工程习惯（对应教程第 6 节）：
#   - 幂等：每次先清空 dist/，重跑不会产生脏文件
#   - 可追溯：把 commit SHA 与构建时间写进 BUILD_INFO，排障时能对上版本
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[build] 清理旧产物 dist/ ..."
rm -rf dist
mkdir -p dist

echo "[build] 复制源码 ..."
cp -R src/. dist/

GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo 'no-git')"
BUILD_TIME="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

cat > dist/BUILD_INFO.json <<EOF
{
  "name": "cicd-demo-project",
  "version": "$(node -p "require('./package.json').version")",
  "gitSha": "${GIT_SHA}",
  "builtAt": "${BUILD_TIME}"
}
EOF

echo "[build] 完成，dist/ 内容："
ls -la dist
