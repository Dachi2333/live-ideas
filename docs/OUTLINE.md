# Live Ideas — 项目大纲 v4

**Date:** 2026-09-11  
**Current target:** Text Capture V1 → Open Source → Dogfood → Photo Capture V2  
**UI source of truth:** Figma

---

# 一句话

> **Live Ideas 是一个把“现场想到的东西”直接送进 Miro 的低摩擦 Capture 入口。**

现在：

```text
打开 Live Ideas
↓
写一句 idea / observation
↓
Send
↓
Miro Sticky
```

核心不是“记笔记”。

核心是：

> **Capture now. Organize later.**

---

# 为什么从 Live Lyrics 改成 Live Ideas

最初问题来自歌词：

```text
想到一句
↓
Notes
↓
以后再找
↓
复制到 Miro
```

但真正的问题并不是歌词。

同一个断裂也发生在：

```text
展会
Workshop
Field Research
竞品观察
CMF 调研
会议
街头 / 店铺观察
个人创作
```

共同问题：

> **现场负责 Capture，却被迫同时做整理和搬运。**

所以产品正式变成：

```text
Live Ideas
```

---

# 核心原则

> **不要让整理行为杀死想法发生本身。**

> **Capture 负责留下，Organize / Compose 才负责决定意义。**

> **iPhone 是口袋里的便利贴，Miro 是墙。**

---

# V1 做什么

只做 Text Capture。

```text
Capture
↕
Fragments
```

发送链路：

```text
当前文字
↓
本地安全保存
↓
Sending
↓
server-side API
↓
Miro API
↓
固定 Board
↓
Sticky Note
↓
本地标记 Sent
↓
Success feedback
↓
清空 Capture
```

失败：

```text
Failed
↓
原文保留
↓
Retry
```

绝对规则：

> **Miro 成功 + 本地 Sent 持久化之前，绝不清空原文。**

---

# Fragments 是什么

只是：

> **“我以前成功送出去过什么？”**

V1：

```text
newest-first
文本
时间
超长文本折叠
删除本地记录
```

删除本地 Fragments：

```text
只删除本机历史
≠
删除 Miro Sticky
```

Fragments 不是：

```text
Notes
Project Manager
Tag System
Compose Tool
Miro Remote Control
```

---

# UI 从现在开始怎么做

## Figma = Source of Truth

不再：

```text
看截图
↓
实现侧猜尺寸 / 猜颜色 / 猜 icon
↓
不断来回调
```

改成：

```text
Figma 定稿
↓
开发读取真实尺寸 / 色值 / vector / motion
↓
高保真实现
↓
真机验收
```

Figma 需要锁定：

```text
两个黑色
橙色
Logo / Live Ideas wordmark
字号 / 字重
Capture / Fragments 尺寸与位置
是否使用 icon
Send / Retry vector
placeholder
Success feedback
Fragments delete UI
long text clamp / expand
active indicator
swipe motion
```

正式 UI 不保留：

```text
Ready
Typing…
未经设计确认的大橙色框
字符箭头 / 字符 Retry
松手以后才开始的 swipe
```

---

# Swipe 必须是真的跟手

目标：

```text
手指拖 20%
↓
页面移动 20%
↓
indicator 同步移动
```

松手：

```text
距离 / 速度够
→ 完成切页

距离 / 速度不够
→ 回弹
```

不是：

```text
touchend
↓
才开始播放动画
```

点击 Capture / Fragments 也必须可以正常切换。

---

# 当前实现仕組み

```text
iPhone / Browser
│
├─ Capture UI
├─ localStorage
│   ├─ 当前 Draft
│   └─ Fragments history
│
└─ POST /api/fragments
        ↓
Server runtime
│
├─ owner / auth gate
├─ server-side Miro secret
└─ Miro client
        ↓
Miro Board
│
├─ 读取当前 Sticky
├─ 处理 Frame / Canvas 坐标
├─ 几何碰撞判断
├─ 找空位
└─ Create Sticky
```

最重要：

```text
Miro Token
绝对不进浏览器
绝对不进 GitHub
```

位置现在由 server 根据真实 Board 状态决定。

V1 clean-up：

```text
删除客户端残留 position contract
统一 server-side positioning
保留 overlap / frame regression tests
```

---

# Live Lyrics → Live Ideas 全局改名

需要改：

```text
UI
PWA metadata
README
PRD / Outline
Docs
Tests
Deployment copy
App name
```

但 localStorage 不能粗暴重命名。

必须：

```text
检测 live-lyrics:*
↓
迁移到 live-ideas:*
↓
确认成功
↓
继续使用新 key
```

不能因为换名字让旧 Draft / Fragments 消失。

---

# 第一版开源

完成顺序：

```text
Figma UI
↓
高保真实现
↓
全局 Live Ideas rename
↓
V1 clean-up
↓
真机 acceptance
↓
README / Setup / Use Guide
↓
Open Source
↓
Deploy
```

公开 repo：

```text
Dachi2333/live-ideas
```

第一版公开需要：

```text
README
Demo GIF / 截图
Architecture
Local setup
Miro setup
Environment variables
Deploy guide
Home Screen guide
Security notes
Tests
LICENSE（发布前决定）
```

公开版不能依赖 Dachi 自己的 ChatGPT Sites owner 配置。

需要至少一种可复现 self-host 方式。

OAuth + Board Picker：

```text
Future setup improvement
不是第一版开源 blocker
```

---

# V1 不做

```text
AI
Tag
Folder
Project
Search
图片
Camera
相册
录音
语音转文字
多个 Board
复杂同步
原生 iOS
Android native
Widget
Lock Screen
Control Center
Action Button
```

一句话：

> **V1 只负责把一段文字可靠地扔到墙上。**

---

# 应用场景

## Personal Idea / Writing

```text
想到一句
↓
Live Ideas
↓
Miro
↓
以后再组织
```

## Exhibition / Trade Show

V1：

```text
看到一个设计
↓
马上写 keyword / observation
↓
Miro
```

V2：

```text
拍图
↓
comment
↓
Miro：图片 + Sticky
```

## Workshop

```text
现场只 Capture
↓
结束以后在 Miro 聚类 / 讨论
```

## Field Research / Store Visit / Competitive Research

```text
现场留下 observation
↓
回公司再分析 / grouping / report
```

---

# V2 第一优先级：Photo + Comment

目标场景：

```text
展会现场
↓
拍一张
↓
写 comment
↓
Send
↓
Miro 里图片和 comment 已经配好
```

解决的不是“上传图片”。

解决的是：

```text
拍很多照片
↓
回公司
↓
传照片
↓
找图
↓
Miro upload
↓
重新写 comment
↓
重新配对
```

这一整段重复劳动。

V2 研究项：

```text
Camera / Photo Library
图片压缩 / 格式
弱网
Upload progress
Retry
图片成功、comment 失败的一致性
图片 + Sticky 布局
Frame 是否作为 capture group
pending queue
privacy
```

**V2 不提前塞进 V1。**

---

# 真机测试

必须拿真实 iPhone 测：

```text
Safari
Home Screen
键盘
中文 / 日文 / 英文 / emoji
多行
长文本
Fragments clamp
刷新
切后台
断网 / 弱网
Miro failure
Retry
Repeated Tap
Success feedback
Fragments delete
左右 drag 跟手
indicator 跟手
drag cancel / complete
真实 Sticky
失败保词
成功清空
旧 localStorage migration
```

---

# 社内汇报

不要先讲技术。

建议：

```text
01 Problem
   Capture → Organize 的断裂

02 Existing workflow
   为什么现在麻烦

03 Live Ideas
   Capture now. Organize later.

04 Demo
   手机一句 → Miro Sticky

05 Why Miro
   不重新造知识库，只做入口

06 Use Cases
   Exhibition / Workshop / Research / Personal

07 Future
   Photo + Comment → Miro

08 Discussion
   哪个场景最值得团队 dogfood？
```

汇报目的：

```text
验证问题
验证场景
验证 dogfood 意愿
决定 Photo V2 是否值得做
```

不是第一次就要求公司正式 adoption。

---

# Roadmap

```text
NOW
Figma UI
↓
V1 exact implementation
↓
Live Ideas global rename + migration
↓
V1 clean-up
↓
iPhone acceptance
↓
Open Source + Deploy + Guide
↓
Dogfood
↓
Internal presentation / feedback
↓
V2 Photo + Comment
↓
Later: Audio / system-level capture
```

---

# 真正成功标准

不是：

> “网站做出来了。”

而是：

```text
看到 / 想到
↓
掏手机
↓
Live Ideas
↓
Capture
↓
Send
↓
继续做原来的事
```

之后：

```text
打开 Miro
↓
已经在那里
```

---

# 产品哲学

> **不要让整理行为杀死想法发生本身。**

> **Capture 负责留下，Organize / Compose 才负责决定意义。**

> **现场不负责整理自己。**

> **iPhone 是口袋里的便利贴，Miro 是墙。**

> **这个工具的价值不是管理更多内容，而是让一个想法更容易活下来。**
