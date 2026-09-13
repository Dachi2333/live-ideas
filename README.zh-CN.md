# Live Ideas

[English](./README.md) · **简体中文** · [日本語](./README.ja.md)

> **Capture now. Organize later. 先留下，之后再整理。**

Live Ideas 是一个面向手机、连接 Miro 的极简 Capture 入口。打开它，写下一条想法或观察，点击发送，内容就会以 Sticky Note 的形式进入你配置好的 Miro Board。

**iPhone 是口袋里的便利贴，Miro 是墙。**

```text
想法出现
→ 打开 Live Ideas
→ 写下来
→ Send
→ Miro Sticky
→ 之后回到电脑再整理
```

Live Ideas 刻意不做完整笔记、项目管理或 Miro 替代品。V1 只解决一件事：尽可能缩短“一个想法发生”到“它留下可靠痕迹”之间的距离。

## V1 有什么

- **Capture**：一个专注的文本输入区和一个发送动作。
- **可靠发送**：只有 Miro 创建成功、且本地 Sent 状态保存成功后，Capture 才会清空。
- **Failed → Retry**：断网或 API 失败时保留原文，可直接重试。
- **Fragments**：当前设备上按时间倒序保存的成功发送历史。
- **6 行预览**：长文本在 Fragments 里最多显示 6 行，但完整原文仍然保存。
- **本地删除**：向左滑 Fragment 可以删除本机历史；**不会删除 Miro 里的 Sticky**。
- **跟手切页**：Capture ↔ Fragments 的横向滑动会跟随手指。
- **Board-aware placement**：服务端根据 Miro 当前 Sticky 几何位置寻找空位，减少重叠。
- **Secret 留在服务端**：Miro Access Token 不会进入浏览器 JavaScript。

## 架构

```text
手机 / 浏览器
├─ Capture UI
├─ localStorage
│  ├─ 当前草稿
│  └─ 已发送 Fragments 历史
└─ POST /api/fragments
       ↓
同源 Worker
├─ 身份验证
├─ 服务端 Miro Secret
└─ Miro client + 位置计算
       ↓
指定 Miro Board
└─ Sticky Note
```

详细说明见 [Architecture](./docs/ARCHITECTURE.md)。

## 快速开始

需要：

- Node.js **22.13+**
- 一个拥有 `boards:read` 与 `boards:write` 权限的 Miro App / Token
- 一个目标 Miro Board

```bash
git clone https://github.com/Dachi2333/live-ideas.git
cd live-ideas
npm ci
npm test
npm run build
```

完整配置和部署流程见 [Setup](./docs/SETUP.md)。

## 两种部署方式

### ChatGPT Sites

当前维护者的私人版本使用 ChatGPT Sites，服务端配置：

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
OWNER_EMAIL
```

`OWNER_EMAIL` 会与 Sites 提供的已登录用户邮箱匹配，适合 owner-only dogfood。

### Cloudflare Workers 自部署

公开版本提供可复现的 Cloudflare Workers self-host 路径：

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
SELF_HOST_PASSWORD
```

配置 `SELF_HOST_PASSWORD` 后，整个 App 会使用 HTTP Basic Authentication 保护。固定用户名是：

```text
liveideas
```

请使用足够长且唯一的密码，并只通过 HTTPS 使用。具体步骤见 [Setup](./docs/SETUP.md) 与 [Security](./docs/SECURITY.md)。

## 怎么使用

完整中文教程：[docs/USAGE.zh-CN.md](./docs/USAGE.zh-CN.md)

日常流程只有几步：

1. 打开 **Capture**。
2. 在 `Type your idea...` 中输入内容。
3. 点击 Send。
4. 请求进行中显示 `Sending...`。
5. 成功时短暂显示 `Your idea was sent to Miro`，随后 Capture 清空。
6. 如果失败，原文保留，并显示 `Failed to send. Tap to retry.` 与 Retry 按钮。

其他语言：

- [English usage guide](./docs/USAGE.md)
- [日本語の使い方](./docs/USAGE.ja.md)

## 数据和隐私

- 当前 Draft 和 Fragments 历史保存在这个浏览器的 `localStorage`。
- V1 不做跨设备同步，所以 Fragments 属于当前设备 / 浏览器。
- 成功发送的 Capture 文本会通过同源 Worker 发往你配置的 Miro Board。
- 删除本地 Fragment 不会删除对应的 Miro Sticky。
- Live Ideas 默认不包含分析统计代码。
- 不要把真实 Miro Token、Board ID、密码、`.env` 或 `.dev.vars` 提交到 Git。

完整安全模型见 [Security](./docs/SECURITY.md)。

## V1 明确不做

V1 = **Text Capture only**。

暂不包含 AI、Tag、Folder、Search、Project、多目的地、音频、拍照 / 图片、原生移动 App、复杂云同步。

当前 V2 第一候选是：**Photo + Comment → Miro**，用于展会、Workshop、店铺观察和 Field Research。

## 开发

```bash
npm run dev
npm test
npm run build
npm run preview
```

测试覆盖 Capture 可靠性、本地持久化与旧数据迁移、Fragments 删除、UI contract、API 授权、Miro 位置计算以及 self-host 授权。

## 文档

- [PRD](./docs/PRD.md)
- [项目大纲](./docs/OUTLINE.md)
- [Setup](./docs/SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Security](./docs/SECURITY.md)
- [真机验收](./docs/DEVICE_ACCEPTANCE.md)

## License

Live Ideas 采用 [MIT License](./LICENSE) 开源。
