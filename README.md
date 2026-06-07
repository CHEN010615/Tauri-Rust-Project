# PluginCore Tauri Resource Dashboard

一个使用 Tauri、Rust、TypeScript 和 React 构建的本机桌面资源监控看板。项目从 Electron 版本迁移而来，前端保留 React + MUI + ECharts 的仪表盘体验，系统信息采集改由 Rust/Tauri command 提供。

## 功能

- CPU、内存、网络、磁盘资源监控
- 实时刷新遥测数据
- 中英文切换
- macOS 原生窗口控制按钮
- Tauri 原生桌面应用打包

## 技术栈

- Tauri 2
- Rust
- React 19
- TypeScript
- Vite
- MUI
- ECharts
- pnpm

## 环境要求

- Node.js
- pnpm
- Rust/Cargo
- macOS 开发环境

本机验证时使用：

```bash
node --version
pnpm --version
cargo --version
```

## 安装依赖

```bash
pnpm install
```

## 开发运行

```bash
pnpm tauri:dev
```

或：

```bash
pnpm tauri dev
```

## 构建前端

```bash
pnpm build
```

## 构建桌面应用

```bash
pnpm tauri:build
```

构建后的 macOS 应用位于：

```text
src-tauri/target/release/bundle/macos/PluginCore.app
```

## 项目结构

```text
.
├── src/                  # React 前端
├── src-tauri/            # Tauri/Rust 后端
├── index.html
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
└── vite.config.ts
```

## 已忽略的本地文件

以下内容不会提交到 GitHub：

- `node_modules/`
- `.pnpm-store/`
- `dist/`
- `src-tauri/target/`
- `src-tauri/gen/`
- 日志、诊断报告、临时文件
- 本地环境变量文件

## 常用检查

```bash
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
pnpm tauri:build
```
