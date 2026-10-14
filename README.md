# cicd-demo-project：CI/CD 通用教程配套示例项目

本项目是 [《CI/CD 通用教程：学会 GitHub Actions，一通百通》](../ci-cd-tutorial-from-github-actions.md) 的可运行配套示例。
设计目标：**零运行时依赖、离线可跑、本地与 CI 执行同一套命令**。你不需要安装任何测试框架——Node.js 20+ 自带的 `node:test` 就是测试框架。

## 它演示了什么

| 能力 | 本地命令 | CI 中的位置 |
|---|---|---|
| 静态检查（零依赖 lint） | `npm run lint` | `02-ci.yml` 的 lint job |
| 单元测试（node:test） | `npm test` | `02-ci.yml` 的 test 矩阵（Node 20/22 × Linux/Windows） |
| 覆盖率 | `npm run test:coverage` | coverage job，报告作为 artifact 上传 |
| 构建（幂等打包） | `npm run build` | build job，`dist/` 作为 artifact 传递 |
| 部署（参数校验 + 密钥注入 + dry-run） | `npm run deploy -- staging` | deploy-staging job（仅 main 分支） |
| 发布 | — | `04-release.yml`：打 `v*` tag 自动发 GitHub Release |
| 流水线复用 | — | `_reusable-test.yml` + `03-reusable-demo.yml` |

## 目录结构

```
example-project/
├── src/                    # 被测源码（math.js 工具函数 + index.js 入口）
├── test/                   # node:test 测试用例（自动发现 *.test.js）
├── scripts/
│   ├── lint.mjs            # 零依赖 lint：语法检查 + 禁 debugger + 末尾换行
│   ├── build.sh            # 幂等构建：清空 → 复制 → 写 BUILD_INFO.json
│   └── deploy.sh           # 模拟部署：环境/密钥校验，绝不把 token 写进产物
├── .github/workflows/      # GitHub Actions 工作流（教程主线）
│   ├── 01-hello.yml        # L1：第一条流水线
│   ├── 02-ci.yml           # L2–L6：主流水线（lint/test/coverage/build/deploy DAG）
│   ├── _reusable-test.yml  # L7：可复用工作流（被调用方）
│   ├── 03-reusable-demo.yml # L7：调用方（双版本 + 定时回归）
│   └── 04-release.yml      # L9：tag 触发发布 Release
├── other-platforms/        # 教程 §4 的翻译练习：同一条流水线的另外四家写法
│   ├── gitlab-ci.yml       # → 复制为仓库根 .gitlab-ci.yml
│   ├── Jenkinsfile         # → 复制为仓库根 Jenkinsfile
│   ├── circleci-config.yml # → 复制为 .circleci/config.yml
│   └── tekton.yml          # → kubectl apply（需要装有 Tekton 的 K8s 集群）
├── package.json
├── package-lock.json       # 零依赖 lockfile，保证 npm ci 可重复安装
└── .gitattributes          # 强制 *.sh 为 LF（教程第 7 节的 Windows CRLF 坑）
```

## 本地运行（与 CI 完全一致的检查序列）

前置：Node.js ≥ 20。

```bash
npm ci                 # 按 lockfile 安装（本项目零依赖，秒完）
npm run lint           # 静态检查，失败退出码非零
npm test               # 单元测试
npm run test:coverage  # 覆盖率（实验参数，Node 20/22 均支持）
npm run build          # 产出 dist/
DEPLOY_TOKEN=ci-dry-run-token npm run deploy -- staging   # 模拟部署
```

建议故意制造一次失败，观察非零退出码（这正是 CI 判定红/绿的依据）：

```bash
# 例：临时在 src/math.js 加一行 debugger;，再跑 lint，会看到规则报错且退出码为 1
```

## 推送到 GitHub 后会发生什么

1. 新建 GitHub 仓库并推送（公开/私有均可）；
2. push 到任意分支 → `01-Hello` 运行；发 PR 或 push main → `02-CI` 运行完整 DAG；
3. 在 Actions 页面手动触发 `03-Reusable-Demo`，观察同一个 reusable workflow 被双版本调用；
4. 执行 `git tag v0.1.0 && git push origin v0.1.0` → `04-Release` 自动构建并创建 Release（含 `dist` 压缩包）。

### Secrets（可选配置）

- 不配置任何 secret 也能全绿：部署步骤会自动使用演练令牌，日志与产物中标注 `"dryRun": true`；
- 想演练真实链路：仓库 **Settings → Environments → staging → Add secret**，名为 `DEPLOY_TOKEN`，值随意（脚本只校验存在性）。注意 PR 来自 fork 时默认拿不到 secret，这是 GitHub 的安全设计（教程 §3.4）。

## 用另外四家平台跑同一条流水线

对照教程 §4 与 §8 的 L8 练习：

1. 先读 `other-platforms/` 中每个文件头部的"对照学习要点"注释；
2. 按注释把文件复制/重命名到对应仓库位置；
3. 推送后观察行为是否与 GitHub Actions 版本一致；
4. **进阶**：不看注释，自己先把 `02-ci.yml` 翻译成目标平台版本，再与文件对照订正。

Tekton 还需要：一个装有 Tekton Pipelines 的 K8s 集群、`tkn` CLI，以及 `tkn hub install task git-clone`。

## 建议练习路径

严格按教程 §8.1 的 L1–L9 推进：

1. 先跑通本项目全部工作流；
2. 故意改坏代码（改错返回值、加 debugger、删换行）观察各 job 变红的位置；
3. 给 `math.js` 增加一个 `multiply` 函数并补测试，观察覆盖率变化；
4. 把 deploy 目标扩展出 `production` 环境，加人工审批门（GitHub Environments 的 required reviewers）；
5. 完成 `other-platforms/` 的翻译对照练习。

## 本地调试 GitHub Actions（可选）

- [act](https://github.com/nektos/act) 可在本地用 Docker 运行工作流：`act pull_request`；
- 但 act 对 Windows/macOS runner、部分托管 action 的支持有限，**最终以 GitHub 上的真实运行为准**。

---

*本示例与教程同步基于 2026-10 的 GitHub Actions 现行语法；工具升级后如遇语法告警，以官方文档为准。*
