# Lyric Capture — PRD v1

**Status:** Locked V0 / Source of Truth  
**Version:** v1  
**Date:** 2026-09-08  
**Working name:** Lyric Capture  
**Owner:** Dachi  
**Primary use case:** 在 iPhone 上以最低摩擦捕捉歌词片段，并自动投递到固定 Miro Board 生成便利贴，供之后集中创作时使用。

---

## 0. 核心原则

> **不要让整理行为杀死灵感发生本身。**

Lyric Capture 不是笔记 App，不是歌词编辑器，不是知识管理工具。

它只解决一个问题：

> 当一句歌词、一个词、一小段语言突然出现时，用户能否在几秒内把它留下，并让它自动进入之后真正创作所用的空间画布，而不需要二次搬运。

Capture 和 Compose 必须彻底分离：

```text
Capture
现在 / 手机 / 一句话 / 几秒钟
        ↓
Board
自动进入 Miro 成为 Sticky Note
        ↓
Compose
以后 / 电脑 / 集中创作 / 拖拽组合
```

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

因此需要一个极小的 Capture Instrument。

---

# 2. 产品定义

Lyric Capture 是一个**单用途歌词片段投递器**。

用户在 iPhone 上输入一句或一段文本，点击发送：

1. 文本被发送到一个固定的 Miro Board；
2. Miro Board 中自动生成一张 Sticky Note；
3. 本地保留一份已发送记录；
4. 输入界面立即恢复为空白；
5. 用户不需要在 Capture 阶段做任何整理。

---

# 3. 非目标

V0 明确不做以下任何功能：

- 不做完整笔记系统；
- 不做歌词编辑器；
- 不做 Song / Project 管理；
- 不做 Verse / Hook / Bridge 分类；
- 不做 tag；
- 不做 AI 改写；
- 不做 AI 分类；
- 不做 AI 推荐；
- 不做自动押韵；
- 不做语音转文字；
- 不做录音；
- 不做图片；
- 不做搜索；
- 不做收藏；
- 不做文件夹；
- 不做多 Board 切换；
- 不做多个 Destination；
- 不做协作；
- 不做账号系统；
- 不做社交功能；
- 不做公开分享；
- 不做 Android；
- 不做 Web App；
- 不做 Miro 替代品；
- 不做 Board 内整理逻辑；
- 不做“智能创作工作流”。

**任何新增功能默认拒绝进入 V0。**

---

# 4. 用户故事

## US-01 — 瞬间捕捉

作为用户，当我突然想到一句歌词时，我希望打开一个极简输入入口，直接输入并发送，这样我不需要先决定它属于哪里。

### Acceptance

- 打开后输入区域立即可用；
- 不要求标题；
- 不要求选择文件夹；
- 不要求选择 Board；
- 不要求添加 tag；
- 输入后只需要一次明确发送动作。

## US-02 — 自动进入 Miro

作为用户，我发送一个 fragment 后，我希望它自动出现在固定的 Lyrics Miro Board 中，这样之后打开电脑就能直接开始组合。

### Acceptance

- 每次成功发送对应一张新 Sticky Note；
- Sticky 文本与发送文本一致；
- 中文、英文、日文、emoji 必须正常；
- 用户无需打开 Miro；
- 用户无需二次复制粘贴。

## US-03 — 查看已发送片段

作为用户，我有时不想打开 Miro，但想确认自己之前写过什么，所以需要一个极简的 Fragments 列表。

### Acceptance

- Capture 页面存在一个小型 `Fragments` 入口；
- 进入后可以看到已成功发送的文本；
- 默认按发送时间倒序；
- 每条至少显示文本与时间；
- Fragments 是发送记录，不是第二套创作系统；
- 不提供分类、编辑工作流或组织系统。

## US-04 — 发送失败不能丢词

作为用户，如果我在地铁、弱网或 Miro API 出错时发送，我绝不能失去原始歌词。

### Acceptance

- 只有确认 Miro 创建成功后，才可将当前 fragment 标记为 Sent；
- 发送失败时原文本必须留在本地；
- 用户能够再次发送；
- 错误反馈必须简短，不覆盖输入内容。

---

# 5. V0 界面

## 5.1 Capture

唯一主界面：

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

- 输入框占据主要视觉空间；
- 无标题栏信息噪音；
- 无分类；
- 无工具栏；
- 无格式控制；
- `↗` 是唯一主动作；
- `Fragments` 是唯一辅助入口。

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

- 只读优先；
- 时间倒序；
- 视觉尽量接近一叠数字便利贴的索引，而不是 Notes App；
- 不承担 Compose；
- 不鼓励在这里长期整理。

---

# 6. Miro 行为

## 6.1 Destination

V0 只绑定：

- 一个 Miro Account；
- 一个固定 Lyrics Board；
- 一个固定接收区域 / 坐标策略。

用户首次配置完成后，日常 Capture 不再出现 Destination 选择。

## 6.2 Sticky Creation

每次发送：

```text
fragment text
↓
Miro REST API
↓
Create Sticky Note
↓
Lyrics Board
```

要求：

- 使用 Miro 官方 API；
- 使用最小必要写权限；
- 不读取无关 Board 内容；
- 不分析已有 Miro 内容；
- 不依赖 Miro App 打开；
- 不在代码仓库中提交 access token / secret。

## 6.3 Sticky Position

V0 只需要一个可预测的自动位置策略。

目标不是自动排版漂亮，而是避免所有 Sticky 完全重叠。

可采用固定起点 + 简单网格排列。

**不做智能布局。**

---

# 7. 本地数据模型

每个 fragment 最少包含：

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

- 本地记录是安全副本与 Fragments 数据源；
- Miro 是创作画布；
- 两者职责不同；
- V0 不做复杂双向同步。

---

# 8. 发送状态机

```text
Draft
  ↓
用户点击 ↗
  ↓
Sending
  ├── success → Sent → 清空 Capture → 新空白
  │
  └── failure → Failed → 保留原文 → 可重试
```

绝对规则：

> **没有收到成功结果，不删除原文本。**

---

# 9. 权限与安全

V0 采用最小权限原则。

需要：

- 网络访问；
- Miro Board 写入权限；
- 本地保存 Fragments 的能力。

不需要：

- 定位；
- 相册；
- 相机；
- 麦克风；
- 通讯录；
- 日历；
- Apple Notes 访问；
- Miro 全局读取权限。

安全要求：

- Token / Secret 不写入 Git；
- `.env` / secret storage 与 repo 分离；
- README 必须明确配置步骤；
- 公开仓库不得包含私人 Board ID、Access Token、Client Secret 等私人凭据。

---

# 10. 技术实现方向

## 10.1 V0 优先

优先使用 iPhone 上低摩擦 Capture 环境 + Miro REST API。

当前首选实现可基于 Drafts Action / iOS 快捷入口完成。

Repository 主要保存：

- Capture Action / Script；
- Miro adapter；
- 本地 Fragments 行为；
- Setup documentation；
- test / mock；
- 配置模板。

如果 Drafts 的 UI 无法达到最终期望，可在真实 dogfood 后再判断是否值得做独立 iOS App。

**V0 不因为“未来可能独立开发”而提前造完整 App。**

---

# 11. 开发工作流

本项目同时用于验证 Dachicore 的 Cloud-first 开发方式。

## 11.1 Source of Truth

GitHub repository 是唯一代码 Source of Truth。

## 11.2 Implementation

主要实现环境：

```text
Codex Cloud
↓
GitHub branch
↓
code / test / diff
↓
PR / review
```

目标：

- 可以从公司电脑浏览器推进；
- 不要求家中电脑一直在线；
- 不把本地机器作为开发流程中心。

## 11.3 Local / Device Acceptance

云端开发不能替代真实 iPhone 验收。

必须在 iPhone 测：

- 打开入口速度；
- 键盘是否立即可用；
- 输入 → 发送是否足够快；
- 中文 / 日文 / 英文 / emoji；
- 弱网；
- 无网；
- Miro API 失败；
- 连续发送；
- 重复点击；
- 长文本；
- Fragments 是否正确出现；
- Miro 是否真的生成 Sticky；
- 发送成功后是否回到干净 Capture。

---

# 12. 核心验收标准

V0 只有在以下体验成立时才算成功：

## Capture

```text
打开
↓
写
↓
↗
↓
结束
```

中间不得出现额外组织步骤。

## Board

回家打开 Miro：

> 白天所有成功发送的 fragment 已经以 Sticky Note 形式存在。

## Fragments

不打开 Miro，也能快速看到自己发送过的歌词片段。

## Reliability

发送失败绝不丢词。

---

# 13. Dogfood 指标

V0 不使用 DAU、增长、留存等 SaaS 指标。

只观察：

1. 我想到歌词时是否真的愿意用它？
2. Capture 是否比 Apple Notes 更快或至少更直接？
3. 我是否停止了“晚上再搬去 Miro”的重复劳动？
4. 我打开 Miro 时是否真的更容易进入 Compose？
5. Fragments 是否足够让我在手机上回看，而不会诱发整理行为？
6. 有没有哪一步让我犹豫超过几秒？

如果连续真实使用后，回答基本为“是”，V0 成功。

---

# 14. Anti-Scope Creep Rule

任何新功能进入前必须回答：

> **它是否直接减少“灵感发生 → 留下痕迹”之间的摩擦？**

如果不是，默认不加。

尤其禁止因为“以后开源可能有人需要”提前加入功能。

当前用户首先是 Dachi 本人。

---

# 15. 产品哲学

> **灵感发生时，不要求灵感负责整理自己。**

> **Capture 只负责留下；Compose 才负责决定意义。**

> **Miro 是墙，iPhone 是口袋里的便利贴。**

> **这个工具的价值不在于管理更多内容，而在于让一句话更容易活下来。**

---

# END — V0 LOCK

V0 只有：

```text
Fragments    ↗
```

以及这条链路：

```text
type something
↓
↗
↓
Miro Sticky
```

**不加任何东西。**
