# Live Ideas — PRD v4

**Status:** Active V1 Definition / Source of Truth  
**Version:** v4  
**Date:** 2026-09-11  
**Product name:** Live Ideas  
**Owner:** Dachi  
**Current release target:** Text Capture V1 + open-source baseline  
**Primary use case:** 在 iPhone 上以最低摩擦捕捉一句想法、一条观察或一段文本，并自动投递到固定 Miro Board，供之后集中整理、研究、创作或讨论。  
**Implementation direction:** Web App；当前私人部署优先使用 ChatGPT Sites；公开版本保持 Web-first / self-hostable，不依赖 Drafts，不以原生 iOS App 作为前提。  
**UI source of truth:** Figma。正式 UI 不再由实现侧自行推测；尺寸、颜色、字体、图标、状态和 motion 以最终 Figma 为准。

---

# 0. v4 相对 v3 的关键变化

1. 产品正式从 **Live Lyrics** 更名为 **Live Ideas**。
2. 产品定位从“歌词文本片段投递器”扩展为“现场想法 / 观察 / 文本的低摩擦 Capture 入口”。
3. **Miro 仍然是之后整理与组合的主空间，Live Ideas 不承担 Compose。**
4. 当前 V1 仍然只做 **Text Capture**；图片、音频等新媒介不进入 V1。
5. **Photo + Comment → Miro** 被列为 V2 第一优先级候选，用于展会、Workshop、Field Research 等现场场景。
6. UI 进入 Figma-first 流程：设计由 Figma 定稿，开发只负责高保真实现，不再边开发边猜设计。
7. Fragments 增加本地记录删除能力；删除本地记录 **不删除 Miro 中已创建的内容**。
8. Fragments 中超长文本默认折叠 / 截断显示，但完整文本仍然保留。
9. 删除 `Ready` / `Typing…` 等持续状态文案；保留必要的 Sending / Error / Success 反馈。
10. Capture ↔ Fragments 的左右切换需要支持真正的 direct-manipulation swipe：页面与底部 indicator 必须跟手，而不是松手后才开始动画。
11. 第一版公开发布需要补齐：开源、部署说明、Setup、使用说明和可复现的 self-host 流程。
12. 旧 `live-lyrics:*` 本地数据必须迁移到新的 `live-ideas:*` key，不能因改名导致用户历史和草稿消失。

---

# 1. 核心原则

> **不要让整理行为杀死想法发生本身。**

Live Ideas 不是完整笔记 App，不是项目管理系统，也不是 Miro 替代品。

它首先只解决一个问题：

> 当一个想法、一句话、一条观察或一个还没有被整理好的片段突然出现时，用户能否在几秒内把它留下，并直接送进之后真正工作的空间，而不需要二次搬运。

Capture 和 Organize / Compose 必须分离：

```text
Capture
现在 / iPhone / 一句话 / 几秒钟
        ↓
Miro Board
自动进入后续工作空间
        ↓
Organize / Compose
以后 / 电脑 / 集中整理 / 拖拽组合 / 讨论
```

产品原则：

- Capture 负责留下；
- Miro 负责承载之后的整理与组合；
- Live Ideas 不要求用户在现场先想清楚分类；
- 任何新增能力都必须先回答：它是否减少了“发生 → 留下”之间的摩擦？

---

# 2. 背景与问题

## 2.1 原始个人场景

此前真实流程：

```text
突然想到一句歌词 / 一个想法
↓
打开 iPhone 备忘录
↓
输入
↓
与其他生活信息混在一起
↓
之后打开 Miro
↓
逐条寻找
↓
复制 / 粘贴
↓
整理成便利贴
```

问题：

- Capture 与整理被绑定在一起；
- 想法发生时，多一步操作都可能打断原始语言；
- 中间存储与最终工作空间分离；
- 二次搬运产生重复劳动；
- “以后再整理”本身形成心理负担；
- Miro 很适合做墙，但不适合做手机上的瞬时入口。

## 2.2 扩展后的工作场景

同样的问题也出现在：

- 展会 / 展览调研；
- Workshop；
- Field Research；
- 竞品观察；
- CMF / 产品案例收集；
- 用户访谈中的即时记录；
- 会议中的快速想法；
- 街头 / 店铺 / 旅行观察；
- 个人创作碎片。

核心共性不是“歌词”，而是：

> **现场负责 Capture，之后才负责 Organize。**

---

# 3. 产品定义

Live Ideas V1 是一个**单用途 Text Capture → Miro 投递器**。

用户在 iPhone 上打开 Live Ideas，输入一句或一段文本并发送：

1. 当前文本先被安全保留；
2. Fragment 进入发送状态；
3. 服务端安全调用 Miro API；
4. 固定 Miro Board 中创建一张 Sticky Note；
5. 成功后本地 fragment 标记为 Sent；
6. Capture 清空；
7. 用户继续做自己的事，不需要在 Capture 阶段整理。

V1 只包含两个日常空间：

```text
Capture  ↔  Fragments
```

Live Ideas Web App 本体拥有：

- Capture UI；
- Fragments 历史视图；
- Fragment 状态逻辑；
- 本地持久化；
- 安全的 server-side Miro 请求入口；
- 固定 Board 的 Sticky 创建与位置策略。

---

# 4. V1 非目标

V1 明确不做：

- 完整笔记系统；
- Project / Folder / Song 管理；
- tag；
- 搜索；
- AI 改写；
- AI 分类；
- AI 推荐；
- 自动整理；
- 图片 Capture；
- 相机 / 相册；
- 录音；
- Melody Fragment；
- 语音转文字；
- 多 Board；
- 多 Destination；
- Board 内智能布局；
- 账号系统；
- 社交；
- 公开分享；
- 复杂云同步；
- 原生 iOS / Android App；
- Widget / Lock Screen / Control Center / Action Button。

**Photo Capture 属于 V2，不因为已经证明技术上可能而提前塞进 V1。**

---

# 5. 用户故事

## US-01 — 瞬间捕捉

作为用户，当我突然想到一句话或观察到一个值得留下的点时，我希望打开 Live Ideas 后立即进入 Capture，直接输入并发送。

### Acceptance

- iPhone Safari / Home Screen 打开后直接进入 Capture；
- 输入区域立即可用；
- 不要求标题；
- 不要求 Board 选择；
- 不要求 tag；
- 一次明确发送动作即可完成；
- 日常 Capture 不出现 Setup 或 Destination 选择；
- 默认 placeholder 由 Figma 定稿，不使用旧文案 `Type what you hear...`。

## US-02 — 自动进入 Miro

作为用户，我发送一个 fragment 后，希望它自动出现在固定 Miro Board 中。

### Acceptance

- 每次成功发送对应一张新 Sticky Note；
- Sticky 文本与发送文本一致；
- 中文、英文、日文、emoji 正常；
- 用户无需打开 Miro；
- 用户无需复制粘贴；
- Sticky 不与已有内容发生明显几何重叠。

## US-03 — 查看已发送片段

作为用户，我有时不想打开 Miro，但想确认之前成功发送过什么。

### Acceptance

- `Fragments` 是一级页面；
- 默认按发送时间倒序；
- 每条至少包含文本与时间；
- Fragments 是发送记录，不是第二套创作系统；
- 超长文本默认只显示有限行数，避免一条记录占满整个页面；
- 完整文本仍然保留；
- 用户可以删除当前设备上的 Fragments 历史记录；
- 删除本地历史 **不删除 Miro 中的 Sticky**。

## US-04 — 发送失败不能丢内容

作为用户，如果弱网、断网或 Miro API 出错，我绝不能失去原始文本。

### Acceptance

- 只有 Miro 创建成功且本地 Sent 状态持久化完成后，才清空当前输入；
- 发送失败时原文本必须保留；
- fragment 进入 failed 状态；
- 可以 Retry；
- 错误反馈简短，不覆盖输入内容；
- Retry 使用明确、标准的图形 icon，不使用临时字符符号。

## US-05 — 成功反馈明确但不打扰

作为用户，我希望知道发送成功，但不希望被 modal 或多一步确认打断。

### Acceptance

- 成功后提供短暂、非阻塞反馈；
- 成功反馈不要求再次点击；
- 不长期占据 Capture 视觉空间；
- 精确形式、文案与 motion 由 Figma 定稿。

## US-06 — 页面切换必须跟手

作为用户，我希望 Capture 与 Fragments 之间的左右滑动像真正的移动 App，而不是松手后才播放切页动画。

### Acceptance

- 点击 Tab 可以切页；
- 手指横向拖动时，当前页与目标页的位置实时跟随 drag progress；
- 底部 active indicator 同步跟随 drag progress；
- 松手后根据距离 / 速度决定完成切页或回弹；
- 纵向输入区滚动与横向页面 swipe 不应互相误触；
- motion 参数由 Figma prototype / motion spec 决定。

---

# 6. UI / Design Source of Truth

## 6.1 Figma-first

从 v4 开始：

> **Figma 是 Live Ideas UI 的唯一视觉 Source of Truth。**

开发实现不得自行推测：

- 黑色层级；
- 橙色；
- 字号；
- 字重；
- 圆角；
- 间距；
- icon 形状；
- Logo；
- Capture / Fragments 的位置与尺寸；
- active indicator 长度与位置；
- transition / swipe motion；
- success / error 状态的视觉样式。

实现侧目标是**还原**，不是重新设计。

## 6.2 当前待 Figma 锁定项目

- 两个黑色层级的准确色值；
- 橙色准确色值；
- Live Ideas Logo / wordmark；
- Live Ideas 的最终字号与占比；
- Capture / Fragments 的位置、大小、字重或 icon 方案；
- Capture placeholder 文案；
- Send / Retry icon；
- Success feedback；
- long text 展开方式；
- Fragments 删除入口；
- swipe transition 的阈值、速度、easing。

## 6.3 明确取消的当前实现行为

正式 UI 不应继续保留：

- 持续显示 `Ready`；
- 持续显示 `Typing…`；
- 未经 Figma 定义的大面积高饱和橙色边框 / 框体；
- 字符形式的发送 / Retry icon；
- 松手后才开始的伪 swipe 动画。

---

# 7. Fragments 行为

Fragments 的定义是：

> **“我以前成功送出去过什么？”**

不是：

- Notes；
- Project Manager；
- Miro Remote Control；
- Compose 工具。

V1 行为：

- newest-first；
- 文本 + 时间；
- long text line-clamp；
- 可删除本地历史；
- 不编辑已发送内容；
- 不从 Live Ideas 删除 Miro Sticky；
- 不分类；
- 不搜索；
- 不 tag。

---

# 8. 当前实现仕組み

## 8.1 运行链路

```text
iPhone / Browser
│
├─ Capture UI
├─ localStorage: 当前草稿 + Fragments history
│
└─ POST /api/fragments
        ↓
Server runtime
│
├─ 身份 / owner 检查
├─ hosted env 中读取 Miro 配置
└─ 调用 Miro REST API
        ↓
Miro Board
│
├─ 读取 Sticky 状态
├─ 解析必要的画布坐标
├─ 进行几何碰撞判断
├─ 找下一个可用位置
└─ 创建 Sticky
        ↓
成功后本地标记 Sent
```

## 8.2 安全边界

- Miro token 不进入 browser bundle；
- token 不进入 Git；
- Board / secret 配置与 source 分离；
- 浏览器只调用自己的 server endpoint；
- 当前私人 ChatGPT Sites 部署使用 Sites authenticated owner 信息作为 owner gate。

## 8.3 已知 clean-up

当前实现存在一个历史遗留：浏览器仍携带旧的 position 语义，而最终位置已经由 server-side Miro client 根据 Board 实际状态计算。

V1 收尾应：

- 统一“位置由 server 决定”的 contract；
- 删除无效 / 重复的客户端 position 逻辑；
- 保留现有 collision / frame-relative position regression tests。

---

# 9. Fragment 数据模型

V1 Text Fragment 最少包含：

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

- Fragment Store 是 Capture 安全副本与 Fragments 数据源；
- Miro 是后续工作画布；
- V1 不做复杂双向同步；
- 不提前为 Photo / Audio 塞字段；
- 新媒介进入新版本时再扩展 domain model。

---

# 10. 发送状态机

```text
Draft
  ↓
用户点击 Send
  ↓
Sending
  ├── success → Sent → 本地持久化 → 清空 Capture → 短暂 Success feedback
  │
  └── failure → Failed → 保留原文 → Retry
```

绝对规则：

> **没有确认远端成功并完成本地 Sent 持久化，不清空原文本。**

UI 规则：

- `Ready` / `Typing…` 不作为长期显示状态；
- `Sending` 必须有明确但克制的反馈；
- `Success` 短暂显示后恢复安静；
- `Failed` 必须明确可 Retry。

---

# 11. Web 持久化与改名迁移

## 11.1 当前 Capture 草稿

必须尽可能抵抗：

- 页面刷新；
- Safari 切后台；
- Web App 暂时关闭；
- 网络失败。

## 11.2 Fragments 历史

- 已发送 fragment 至少在当前设备可靠保留；
- V1 不要求跨设备同步；
- 删除记录只影响当前 Live Ideas local history。

## 11.3 Live Lyrics → Live Ideas migration

历史版本使用 `live-lyrics:*` localStorage key。

全局 rename 时必须：

1. 首次运行检测旧 key；
2. 将旧 Draft / Fragments 安全迁移到 `live-ideas:*`；
3. 验证迁移成功后再停止依赖旧 key；
4. 不因品牌改名导致用户数据“看起来消失”。

---

# 12. 权限与安全

V1 需要：

- 网络；
- 浏览器本地存储；
- Miro Board 读写所需最小权限；
- server-side secret；
- 当前私人部署的 owner gate。

V1 不需要：

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
- 私人配置不写进公开 repo；
- README 明确 setup；
- 开源版不得把当前个人 owner 配置硬编码成公共默认方案。

---

# 13. 部署与开源

## 13.1 当前私人部署

当前优先：

```text
GitHub
↓
ChatGPT Sites
↓
iPhone Safari / Home Screen
```

当前私人站点可以继续使用 owner-only + hosted env。

## 13.2 第一版公开发布目标

第一版开源必须包含：

- 可读 README；
- 产品一句话与核心哲学；
- 架构图；
- Setup Guide；
- Miro 配置说明；
- 环境变量说明；
- 本地运行说明；
- 测试说明；
- 部署说明；
- iPhone / Home Screen 使用说明；
- Demo GIF / 截图；
- 明确的安全警告；
- LICENSE（具体许可证待正式发布前决定）。

## 13.3 开源部署原则

公开版本不能假设所有人都拥有当前个人 ChatGPT Sites 环境。

因此公开版本需要：

- 把 deployment / auth 与核心 Capture domain 解耦；
- 至少提供一种可复现的 self-host 方式；
- 保持 Miro secret server-side；
- 不为了“容易部署”回退到前端明文 token。

OAuth + Board Picker 属于未来 setup improvement，不阻塞第一版 OSS。

---

# 14. GitHub / Branch Strategy

Repository：

```text
Dachi2333/live-ideas
```

原则：

- `main` 最终代表公开、可理解、可部署的正式版本；
- 历史 Drafts prototype 保留历史价值，但不进入当前 runtime；
- 当前 Web App branch 完成 V1 acceptance 后再合入 main；
- PR 在真机验收完成前保持 Draft；
- 不把个人 secret / private deployment data 合并进公共 source。

---

# 15. V1 Device Acceptance

真实 iPhone 必须测试：

- Safari；
- Home Screen；
- 键盘打开 / 收起；
- Capture 页面不整体乱跑；
- 中文 / 日文 / 英文 / emoji；
- 多行；
- long text；
- 超长文本在 Fragments 中被折叠而不是占满屏幕；
- 页面刷新；
- 切后台 / 恢复；
- 弱网 / 无网；
- Miro auth failure；
- Miro rate limit / failure；
- Retry；
- repeated tap；
- Success feedback；
- Fragments newest-first；
- Fragments local delete；
- Capture ↔ Fragments 点击切换；
- Capture ↔ Fragments drag 跟手；
- indicator 跟手；
- drag cancel / complete；
- 真实 Miro Sticky 创建；
- 成功后清空；
- 失败后保留原文；
- legacy localStorage rename migration；
- token 未暴露在前端。

---

# 16. V1 核心验收标准

## Capture

```text
打开 Live Ideas
↓
写一句
↓
Send
↓
结束
```

## Board

打开 Miro 后：

> 成功发送的 fragment 已经在那里。

## Fragments

不打开 Miro，也能快速确认自己已经成功发送过什么。

## Reliability

失败绝不丢原文。

## Motion

Capture / Fragments swipe 必须是 direct manipulation，而不是 touch-end 后才开始切页。

## Independence

不依赖：

- Drafts Pro；
- Mac；
- Xcode；
- Apple Developer membership。

---

# 17. Dogfood / Validation 指标

1. 想到东西时是否真的愿意打开？
2. 是否比 Notes → Miro 更直接？
3. 是否停止手工搬运？
4. Home Screen Web App 是否足够接近独立 App？
5. Fragments 是否只提供“确认历史”而没有诱导整理？
6. 是否有任何一步让我犹豫超过几秒？
7. swipe、键盘、长文本是否在真机上破坏流畅感？
8. 在工作现场是否能自然形成新的 Capture 习惯？

---

# 18. 应用场景

## 18.1 Personal Ideas / Writing

```text
想到一句
↓
Live Ideas
↓
Miro
↓
以后再组织
```

## 18.2 Exhibition / Trade Show Report

V1 可先用于纯文字快速记录：

```text
看到一个设计
↓
写一句观察 / keyword
↓
Send
↓
回公司后已经在 Miro
```

V2 目标进一步变成 Photo + Comment。

## 18.3 Workshop

- 每个瞬间想法先 Capture；
- 不要求现场分类；
- 结束后在 Miro 聚类和讨论。

## 18.4 Field Research / Store Visit / Competitive Research

- 现场只负责留下 observation；
- 回到桌面端再进行 grouping、analysis 和 presentation。

---

# 19. V2 第一优先级候选 — Photo Capture

## 19.1 核心场景

展会 / 店铺 / field research 中：

```text
拍图
↓
写 comment
↓
Send
↓
Miro 中同时出现图片 + 对应 Sticky comment
```

目标不是“做一个相册”，而是：

> **在现场就完成 Capture → Miro，避免回公司后重新上传、找图、匹配 comment、摆放。**

## 19.2 V2 需要解决

- Camera / Photo Library 入口；
- 图片压缩与格式兼容；
- 上传进度；
- 弱网 / 失败 retry；
- image 成功但 comment 失败时的一致性；
- image 与 Sticky 的配对与布局；
- 是否使用 Frame 作为一组 Capture 的容器；
- local pending queue；
- 隐私与图片数据处理。

## 19.3 明确不进入 V1

Photo Capture 即使产品价值高，也必须等 Text V1 完成、开源、dogfood 后再进入实现。

---

# 20. Future — Audio / Other Capture Modalities

如果 Live Ideas 的 Capture 模型成立，未来可以扩展：

- 原始音频 / melody fragment；
- 系统级入口；
- Widget / Action Button；
- 更自然的现场 capture modality。

原则不变：

> 新媒介只是新的 Capture 类型，不应把 Live Ideas 变成复杂管理工具。

---

# 21. 社内汇报 / 产品验证流程

UI + V1 稳定后，再进入内部汇报。

建议叙事：

```text
Problem
↓
现有 Capture → Organize 断裂
↓
Live Ideas 核心原则
↓
30 秒真实 Demo
↓
当前 architecture / security
↓
Use Cases
↓
Photo + Comment V2
↓
向团队收集真实问题与反馈
```

汇报目标不是立刻要求“公司正式采用”，而是验证：

- 这个问题是否普遍存在；
- 哪个现场场景价值最高；
- 团队是否愿意 dogfood；
- Photo Capture 是否值得进入下一阶段。

---

# 22. Anti-Scope-Creep Rule

新增功能必须回答：

> **它是否直接减少“想法 / 观察发生 → 留下痕迹”之间的摩擦？**

并进一步回答：

> **它是否必须现在做？**

若第一问不是“是”，默认拒绝。

若第一问是“是”但第二问不是“是”，进入 Future / V2，不进入 V1。

---

# 23. 产品哲学

> **不要让整理行为杀死想法发生本身。**

> **Capture 负责留下，Organize / Compose 才负责决定意义。**

> **现场不负责整理自己。**

> **iPhone 是口袋里的便利贴，Miro 是墙。**

> **这个工具的价值不是管理更多内容，而是让一个想法更容易活下来。**

---

# END — V1 TARGET

V1 只有两个日常空间：

```text
Capture  ↔  Fragments
```

核心链路：

```text
打开 Live Ideas
↓
写下一条 idea / observation
↓
Send
↓
Miro Sticky
```

**V1 = Text Capture Web App。**

**UI = Figma Source of Truth。**

**当前私人部署 = ChatGPT Sites owner-only。**

**第一版完成后开源 + 部署说明 + 使用说明。**

**Photo + Comment = V2 第一优先级候选。**
