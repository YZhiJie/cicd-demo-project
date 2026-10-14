#!/usr/bin/env bash
# 模拟部署脚本：真实项目里这里会调用 kubectl / scp / 云厂商 CLI。
# 本示例只做参数校验 + 幂等记录，重点演示 CD 的四个教学点：
#   1. 必须显式指定目标环境（staging / production），防止误部署
#   2. 密钥通过环境变量注入，绝不写死在脚本或产物里（对应教程 §3.4）
#   3. 幂等可重入：重复执行结果一致，失败时以非零码退出
#   4. 部署前置校验：没有构建产物时直接失败，不带着空包上线
set -euo pipefail

ENV_NAME="${1:-}"

if [[ "${ENV_NAME}" != "staging" && "${ENV_NAME}" != "production" ]]; then
  echo "[deploy] 用法：npm run deploy -- <staging|production>"
  exit 2
fi

if [[ -z "${DEPLOY_TOKEN:-}" ]]; then
  echo "[deploy] 错误：未设置 DEPLOY_TOKEN 环境变量（在 CI 中应来自 secrets）"
  exit 1
fi

# CI 未配置真实 secret 时，工作流传入 ci-dry-run-token 作为开箱即用的演练值。
# 注意：只记录“是否演练”的布尔值，绝不把 token 本身写入任何文件/日志。
DRY_RUN=false
if [[ "${DEPLOY_TOKEN}" == "ci-dry-run-token" ]]; then
  echo "[deploy] 以 dry-run 模拟模式部署（未配置真实 DEPLOY_TOKEN）"
  DRY_RUN=true
fi

if [[ ! -d dist ]]; then
  echo "[deploy] 错误：未找到 dist/，请先执行 npm run build"
  exit 1
fi

echo "[deploy] 正在把 dist/ 部署到 ${ENV_NAME} ..."

# 幂等记录：真实系统中应写入部署平台；这里写本地文件演示
mkdir -p dist
cat > dist/DEPLOYED.json <<EOF
{
  "env": "${ENV_NAME}",
  "deployedAt": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "dryRun": ${DRY_RUN}
}
EOF

echo "[deploy] 成功：${ENV_NAME} 部署完成"
