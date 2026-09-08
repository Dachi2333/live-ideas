# Live Lyrics — PRD v3

**Status:** Locked V0 / Source of Truth  
**Version:** v3  
**Date:** 2026-09-08  
**Product name:** Live Lyrics  
**Owner:** Dachi  
**Primary use case:** 在 iPhone 上以最低摩擦捕捉歌词文本片段，并自动投递到固定 Miro Board 生成便利贴，供之后集中创作时使用。  
**Implementation direction:** Web App，优先部署到 ChatGPT Sites；不依赖 Drafts，不以原生 iOS App 作为 V0 前提。

---

## 0. 核心原则

> **不要让整理行为杀死灵感发生本身。**

Live Lyrics 不是笔记 App，不是歌词编辑器，不是知识管理工具。

它首先只解决一个问题：

> 当一句歌词、一个词、一小段语言突然出现时，用户能否在几秒内把它留下，并让它自动进入之后真正创作所用的空间画布，而不需要二次搬运。

Capture 和 Compose 必须彻底分离：

```text
Capture
现在 / iPhone / 一句话 / 几秒钟
        ↓
Board
自动进入 Miro 成为 Sticky Note
        ↓
Compose
以后 / 电脑 / 集中创作 / 拖拽组合
```

Web App 的意义不是增加功能，而是：

- 不依赖第三方 Capture App；
- 不需要 Mac / Xcode；
- 不需要 Apple Developer 会员才能开始；
- 保持 GitHub + Cloud-first 开发；
- 可以直接通过 Safari / Web App 入口使用；
- 为未来 Native App 保留迁移空间。

---

# 1. 背景

当前真实工作流：

```text
突然想到一句歌词
↓
打开 iPhone 备忘录
↓
新建一条
↓
输入
↓
之后与其他备忘录混在一起
↓
回家打开 Miro
↓
逐条寻找歌词备忘录
↓
复制
↓
粘贴
↓
整理成便利贴
↓
删除已整理备忘录
```

问题：

- Capture 与整理被绑定在一起；
- 灵感发生时多一步操作都可能让原始语言消失；
- Apple Notes 中歌词与其他生活信息混杂；
- 二次搬运产生重复劳动；
- 无法确认哪些片段已经整理；
- “以后再整理”本身构成心理负担；
- Miro 明明适合做歌词便利贴墙，却不是适合瞬间捕捉的入口。

此前尝试过：

```text
Drafts-first
↓
自定义 Action 依赖 Drafts Pro
```

随后考虑过原生 iOS App，但 V0 若采用原生路线，会额外引入：

- macOS / Xcode build 环境；
- Apple signing；
- 真机安装限制；
- Apple Developer Program 的未来成本。

因此 V0 正式调整为：

> **Web App + ChatGPT Sites 优先部署。**

---

# 2. 产品定义

Live Lyrics V0 是一个**单用途歌词文本片段投递器**。

用户在 iPhone 上打开 Live Lyrics Web App，直接输入一句或一段文本，点击发送：

1. 文本被提交；
2. 本地 / Web App 数据层保留 fragment 记录；
3. 服务端安全调用 Miro API；
4. 固定 Miro Board 中创建一张 Sticky Note；
5. 成功后本地 fragment 标记为 Sent；
6. Capture 恢复为空白；
7. 用户不需要在 Capture 阶段做任何整理。

V0 日常主界面只保留：

```text
Fragments                              ↗
```

Web App 本体拥有：

- Capture UI；
- Fragments 历史视图；
- Fragment 状态逻辑；
- 本地 / 站点持久化；
- Miro 请求入口；
- 安全配置层。

不依赖 Drafts、Apple Notes 或原生 iOS App。

---

# 3. 非目标

V0 明确不做：

- 完整笔记系统；
- 歌词编辑器；
- Song / Project 管理；
- Verse / Hook / Bridge 分类；
- tag；
- AI 改写；
- AI 分类；
- AI 推荐；
- 自动押韵；
- 语音转文字；
- 录音；
- Melody Fragment；
- 图片；
- 搜索；
- 收藏；
- 文件夹；
- 多 Board；
- 多 Destination；
- 协作；
- 账号系统；
- 社交；
- 公开分享；
- Android 原生 App；
- 原生 iOS App；
- Miro 替代；
- Board 内整理；
- 智能布局；
- Widget；
- Lock Screen Control；
- Control Center Control；
- Action Button Capture；
- 离线优先系统；
- 复杂云同步。

**任何新增功能默认拒绝进入 V0。**

---

# 4. 用户故事

## US-01 — 瞬间捕捉

作为用户，当我突然想到一句歌词时，我希望打开 Live Lyrics 后立即进入极简输入状态，直接输入并发送。

### Acceptance

- 从 iPhone Safari / Home Screen Web App 入口打开后直接进入 Capture；
- 输入区域立即可用；
- 键盘应尽快进入可输入状态；
- 不要求标题；
- 不要求选择 Board；
- 不要求 tag；
- 输入后只需要一次明确发送动作；
- 日常 Capture 不出现设置或 Destination 选择。

## US-02 — 自动进入 Miro

作为用户，我发送一个 fragment 后，希望它自动出现在固定 Lyrics Miro Board 中。

### Acceptance

- 每次成功发送对应一张新 Sticky Note；
- Sticky 文本与发送文本一致；
- 中文、英文、日文、emoji 正常；
- 用户无需打开 Miro；
- 用户无需复制粘贴。

## US-03 — 查看已发送片段

作为用户，我有时不想打开 Miro，但想确认自己之前写过什么。

### Acceptance

- Capture 页面存在 `Fragments` 入口；
- 进入后看到已成功发送的文本；
- 默认按发送时间倒序；
- 每条至少显示文本与时间；
- Fragments 是发送记录，不是第二套创作系统；
- 不提供编辑 / 分类 / 组织能力。

## US-04 — 发送失败不能丢词

作为用户，如果弱网、断网或 Miro API 出错，我绝不能失去原始歌词。

### Acceptance

- 只有 Miro 创建成功且本地 Sent 状态持久化完成后，才清空当前输入；
- 发送失败时原文本必须保留；
- fragment 进入 failed 状态；
- 可以 Retry；
- 错误反馈简短，不覆盖输入内容。

## US-05 — Web App 不增加 Capture 摩擦

作为用户，我选择 Web App 不是为了接受更多网页感，而是为了获得更低开发门槛且足够接近 App 的 Capture 体验。

### Acceptance

- 打开后直接 Capture；
- 无站点首页；
- 无营销页；
- 无登录墙；
- 无复杂导航；
- `↗` 是唯一主动作；
- `Fragments` 是唯一日常辅助入口。

---

# 5. V0 界面

## 5.1 Capture

```text
┌──────────────────────────┐
│ Fragments                │
│                          │
│                          │
│  type something...       │
│                          │
│                          │
│                    ↗     │
└──────────────────────────┘
```

设计原则：

- 输入区域占据主要视觉空间；
- 打开即 Capture；
- 无标题栏信息噪音；
- 无分类；
- 无工具栏；
- 无格式控制；
- `↗` 是唯一主动作；
- `Fragments` 是唯一日常辅助入口；
- 尽量呈现为独立 App，而不是“网页”。

## 5.2 Fragments

```text
FRAGMENTS

──────────────────────────
我不想死后没人记得我
Today 17:42

──────────────────────────
我的真实是真的真实吗
Today 16:18

──────────────────────────
我连无法接受自己的自己……
Yesterday 23:51
```

设计原则：

- 只读；
- 时间倒序；
- 不承担 Compose；
- 不鼓励整理；
- 不提供搜索、编辑、删除、tag、筛选。

## 5.3 Setup

首次使用需要配置 Miro 相关信息。

Setup 允许存在，但必须与日常 Capture 分离。

要求：

- 配置完成后，正常打开不再进入 Setup；
- Access Token / Secret 不进入前端代码；
- 私人 Board ID 不写进公开 repo；
- 若部署平台支持 server-side secret，则必须使用平台 secret；
- 如果平台不支持安全 server-side secret，则不得把 token 明文放到浏览器前端。

---

# 6. ChatGPT Sites 部署方向

## 6.1 Deployment Target

V0 优先部署到：

> **ChatGPT Sites**

目标：

```text
GitHub
↓
Live Lyrics Web App
↓
ChatGPT Sites
↓
iPhone Safari / Home Screen
```

## 6.2 Sites Feasibility Gate

正式绑定 Miro 前必须验证：

1. Sites 是否能承载当前 Web App UI；
2. 是否支持安全保存 server-side secret；
3. 是否能通过安全 server-side request / proxy 调用 Miro；
4. iPhone Safari 打开体验是否可接受；
5. 添加到主屏幕后的体验是否足够接近独立 App；
6. 页面刷新 / 切后台后，未发送文本是否能可靠保留。

如果 2 或 3 不成立：

> **STOP，不得把真实 Miro token 放进浏览器前端。**

此时允许迁移部署层到其他支持 server-side secret 的 Web hosting，但产品与前端架构不变。

---

# 7. Miro 行为

## 7.1 Destination

V0 只绑定：

- 一个 Miro Account / Token；
- 一个固定 Lyrics Board；
- 一个固定接收区域 / 坐标策略。

日常 Capture 不出现 Destination 选择。

## 7.2 Sticky Creation

```text
fragment text
↓
Live Lyrics Web App
↓
server-side API / secure proxy
↓
Miro REST API
↓
Create Sticky Note
↓
Lyrics Board
```

要求：

- 使用 Miro 官方 API；
- 最小必要写权限；
- 不读取无关 Board 内容；
- 不分析已有 Miro 内容；
- 不依赖 Miro App 打开；
- 不把 Access Token 暴露在 browser bundle / source / network-readable config 中。

## 7.3 Sticky Position

采用固定起点 + 简单网格。

目标：

- 可预测；
- 不完全重叠；
- 不做智能布局。

---

# 8. Fragment 数据模型

V0 Text Fragment 最少包含：

```text
id
text
createdAt
sentAt
status
```

其中：

```text
status = draft | sending | sent | failed
```

原则：

- Fragment Store 是安全副本与 Fragments 数据源；
- Miro 是创作画布；
- V0 不做复杂双向同步；
- 不提前为 Audio / Song 加字段。

---

# 9. 发送状态机

```text
Draft
  ↓
用户点击 ↗
  ↓
Sending
  ├── success → Sent → 清空 Capture
  │
  └── failure → Failed → 保留原文 → Retry
```

绝对规则：

> **没有确认远端成功并完成本地 Sent 持久化，不清空原文本。**

---

# 10. Web 持久化原则

V0 必须解决两个不同问题：

## 10.1 当前 Capture 草稿

当前尚未发送的文本必须在以下情况下尽可能保留：

- 页面刷新；
- Safari 切后台；
- Web App 被暂时关闭；
- 网络失败。

可使用浏览器本地持久化。

## 10.2 Fragments 历史

已发送 fragment 至少要在当前设备可靠保留。

V0 不要求：

- 跨设备同步；
- 用户账号；
- 多端一致性。

如果 ChatGPT Sites 提供稳定的数据存储能力，可以使用；否则 V0 可先采用设备本地存储。

---

# 11. 权限与安全

V0 采用最小权限原则。

需要：

- 网络；
- 本地浏览器存储；
- Miro Board 写入；
- server-side secret / secure proxy 能力。

不需要：

- 相机；
- 相册；
- 麦克风；
- 定位；
- 通讯录；
- 日历；
- Apple Notes；
- iOS native entitlements。

安全要求：

- Token / Secret 不进 Git；
- Token / Secret 不进 browser bundle；
- 私人 Board ID 不进入公开 Source；
- 配置与 repo 分离；
- README 明确 setup；
- 若 Sites 无法安全托管 Miro secret，则先停，不做 insecure fallback。

---

# 12. 技术实现方向

## 12.1 V0 正式方向

```text
Web App
JavaScript / TypeScript
HTML / CSS
Browser Local Persistence
Secure Server-side Miro Proxy
ChatGPT Sites deployment
```

前端框架可保持轻量，不为 V0 引入复杂架构。

Repository 保存：

- Web App source；
- Capture UI；
- Fragments UI；
- Fragment domain model；
- send state machine；
- Miro client contract；
- server-side proxy；
- local persistence；
- tests；
- setup / device acceptance docs。

## 12.2 复用当前 Drafts-first 已验证逻辑

保留：

- Fragment 数据模型；
- `draft / sending / sent / failed`；
- 失败保留原文；
- retry；
- 防重复；
- Miro adapter 规则；
- Sticky 网格位置；
- Fragments newest-first；
- 核心测试语义。

不继续保留：

- Drafts Action；
- Drafts FileManager；
- Drafts Credential；
- Drafts HTMLPreview；
- Drafts editor runtime。

## 12.3 不做 Native Migration

V0 不迁 Swift / SwiftUI。

Native iOS 只作为未来可能路线，用于：

- Widget；
- Lock Screen Control；
- Control Center；
- Action Button；
- 更深的音频录制入口。

---

# 13. GitHub / Branch Strategy

GitHub repository：

```text
Dachi2333/live-ideas
```

保持同一个 repo。

策略：

```text
main
├─ 当前正式 Source
│
├─ 旧 Drafts branch
│   └─ prototype / superseded
│
└─ 新 Web App branch
    └─ V0 implementation
```

要求：

- 不在旧 Drafts branch 上继续堆新路线；
- 从干净 main 开新 Web App branch；
- 旧 Draft PR 可保留历史，但不合并；
- 新 Web App 跑通后，可以删除 Drafts feature branch；
- main 不保留 Drafts-only runtime 代码。

---

# 14. 开发工作流

```text
GitHub
↓
ChatGPT / Codex Cloud
↓
Web App branch
↓
tests
↓
PR
↓
ChatGPT Sites
↓
iPhone acceptance
```

目标：

- 无 Mac 依赖；
- 无 Xcode 依赖；
- 无 Apple Developer 依赖；
- Cloud-first；
- GitHub source of truth。

---

# 15. Device Acceptance

真实 iPhone 必须测试：

- Safari 打开速度；
- Home Screen Web App 打开速度；
- 打开后是否直接 Capture；
- 键盘是否快速进入输入状态；
- 中文 / 日文 / 英文 / emoji；
- 多行；
- 前后空格与特殊字符；
- 页面刷新；
- 切后台 / 恢复；
- 弱网；
- 无网；
- Miro auth failure；
- Miro 429；
- retry；
- repeated tap；
- long text；
- Fragments newest-first；
- Miro Sticky 实际创建；
- 成功后清空；
- 失败后保词；
- token 未暴露在前端。

---

# 16. 核心验收标准

## Capture

```text
点 Live Lyrics
↓
写
↓
↗
↓
结束
```

## Board

打开 Miro 后：

> 白天成功发送的 fragment 已经是 Sticky Note。

## Fragments

不打开 Miro，也能回看已发送片段。

## Reliability

失败绝不丢词。

## Independence

不依赖：

- Drafts Pro；
- Mac；
- Xcode；
- Apple Developer membership。

---

# 17. Dogfood 指标

1. 想到歌词时是否真的愿意打开？
2. 是否比 Apple Notes 更直接？
3. 是否停止手工搬到 Miro？
4. Home Screen Web App 是否足够像 App？
5. Fragments 是否足够回看？
6. 是否有任何一步让我犹豫超过几秒？
7. Safari / Web App 限制是否影响真实使用？

---

# 18. Anti-Scope Creep Rule

新增功能必须回答：

> **它是否直接减少“灵感发生 → 留下痕迹”之间的摩擦？**

如果不是，默认不加。

---

# 19. Future — 不进入 V0

## 19.1 Native iOS

如果 Web App dogfood 成功，未来可以迁原生 iOS。

目的不是重写产品，而是解锁系统级 Capture：

- Widget；
- Lock Screen Control；
- Control Center；
- Action Button；
- 更深的系统级音频入口。

## 19.2 Melody Fragment

未来与 Text Fragment 平行：

```text
系统入口
↓
直接录音
↓
Melody Fragment
```

保存原始声音。

**不默认 speech-to-text。**

## 19.3 Song / Compose

```text
Text Fragment ───┐
                 ├──→ Song
Melody Fragment ─┘
```

Song 属于 Compose，不属于 Capture。

---

# 20. 产品哲学

> **灵感发生时，不要求灵感负责整理自己。**

> **Capture 只负责留下；Compose 才负责决定意义。**

> **语言来了，就留下文字；旋律来了，就留下声音。**

> **Miro 是墙，iPhone 是口袋里的便利贴。**

> **这个工具的价值不在于管理更多内容，而在于让一个想法更容易活下来。**

---

# END — V0 LOCK

V0 只有：

```text
Fragments                              ↗
```

链路：

```text
打开 Live Lyrics Web App
↓
type something
↓
↗
↓
Miro Sticky
```

**V0 = Web App。**

**优先部署到 ChatGPT Sites。**

**不依赖 Drafts。**

**不依赖原生 iOS。**

**不加任何东西。**
