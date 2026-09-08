# Live Lyrics — 项目大纲 v3

## 一句话

一个只干一件事的 Web App：

> **打开 Live Lyrics，写下一句歌词，点一下发送，它就自动出现在固定 Miro Board 里成为一张便利贴。**

优先部署：

> **ChatGPT Sites**

---

# 为什么现在改成 Web App

我们已经走过两条路线：

```text
Drafts
↓
自定义 Action 需要 Pro
```

然后：

```text
原生 iOS App
↓
最终需要 Mac / Xcode / signing 环境
```

V0 真正要验证的其实不是：

> “我们会不会做一个 iOS App？”

而是：

> **这个 Capture 工作流到底会不会真的进入日常。**

所以现在正式锁成：

```text
Web App
↓
ChatGPT Sites
↓
iPhone Safari / Home Screen
```

这样：

```text
不需要 Drafts Pro
不需要 Mac
不需要 Xcode
不需要 Apple Developer
```

先把产品本身跑起来。

---

# 为什么做

现在：

```text
想到一句
↓
Apple Notes
↓
以后找出来
↓
复制
↓
Miro
↓
粘贴
```

真正的问题：

> **Capture 和整理绑在了一起。**

Live Lyrics 把它们拆开。

---

# 正确流程

```text
现在
打开 Live Lyrics
↓
写
↓
↗
↓
结束
```

晚上：

```text
打开 Miro
↓
白天的 fragment 已经在墙上
↓
拖
拼
删
改
↓
Compose
```

---

# 手机上长这样

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

日常只有：

```text
Fragments
↗
```

没有第三个。

---

# ↗ 做什么

```text
当前文字
↓
保存 Draft 状态
↓
Sending
↓
server-side secure proxy
↓
Miro API
↓
固定 Lyrics Board
↓
Sticky Note
↓
本地标记 Sent
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

> **没有确认远端成功 + 本地 Sent 持久化，不清空原文。**

---

# Fragments 是什么

只是：

> **我以前成功扔出去过什么？**

```text
我不想死后没人记得我
Today 17:42

我的真实是真的真实吗
Today 16:18
```

不是：

```text
Notes
Song Manager
Tag System
Project System
```

---

# Miro 是什么

真正的创作墙。

```text
Live Lyrics
↓
Miro Sticky
↓
以后拖拽组合
```

Live Lyrics 不负责 Compose。

---

# 部署

V0 优先：

```text
GitHub
↓
ChatGPT Sites
↓
iPhone
```

iPhone 可以：

```text
Safari 打开
```

并优先测试：

```text
添加到主屏幕
↓
像独立 Web App 一样使用
```

---

# ChatGPT Sites Gate

正式接 Miro 前先确认：

```text
Sites 能跑 Web App UI？
Sites 能安全保存 secret？
Sites 能 server-side 调 Miro？
iPhone 打开体验 OK？
Home Screen 体验 OK？
刷新 / 后台不会丢草稿？
```

其中最重要的是：

```text
secret
server-side Miro request
```

如果不支持：

> **STOP。**

不能为了省事把 Miro token 放前端。

部署层可以换，但产品架构不需要重做。

---

# 技术结构

```text
Live Lyrics Web App
      │
      ├── Capture UI
      ├── Fragment Core
      ├── Local Persistence
      ├── Fragments
      └── Secure API
             ↓
          Miro API
             ↓
          Sticky
```

技术方向：

```text
JavaScript / TypeScript
HTML / CSS
Browser Storage
Server-side API / Proxy
ChatGPT Sites
```

保持轻量。

---

# 之前做过的东西不是白做

继续复用：

```text
Fragment model

draft
↓
sending
├─ sent
└─ failed

失败保词
Retry
防重复
Miro adapter 行为
网格定位
Fragments newest-first
核心测试语义
```

扔掉：

```text
Drafts Action
Drafts FileManager
Drafts Credential
Drafts HTMLPreview
```

也不迁 Swift。

---

# GitHub

继续用原来的：

```text
Dachi2333/live-ideas
```

不新建 repo。

正确做法：

```text
main
│
├─ old Drafts branch
│   └─ superseded
│
└─ new Web App branch
    └─ 正式 V0
```

旧 Draft PR：

```text
保留历史
不合并
```

Web App 稳定后：

```text
可以删旧 Drafts branch
```

main 不留 Drafts runtime。

---

# V0 不做

```text
AI
Tag
Folder
Song
Verse / Hook
搜索
录音
Melody
语音转文字
图片
多个 Board
Android
原生 iOS
Widget
Lock Screen Control
Control Center
Action Button
协作
社交
复杂同步
```

一句话：

> **V0 只负责把一句文字贴到墙上。**

---

# 权限 / 安全

需要：

```text
网络
浏览器本地存储
Miro write
server-side secret
```

不需要：

```text
麦克风
相机
照片
定位
通讯录
Apple Notes
iOS native permission
```

最重要：

```text
Miro Token
绝对不进 GitHub
绝对不进前端 bundle
```

---

# 真机测试

必须实际拿 iPhone 测：

```text
Safari
Home Screen
键盘
中文
日文
英文
emoji
多行
刷新
切后台
断网
弱网
Miro 失败
Retry
Repeated Tap
Fragments
真实 Sticky
失败保词
成功清空
```

---

# 真正成功标准

不是：

> “网站做出来了。”

而是：

```text
掏手机
↓
Live Lyrics
↓
写
↓
↗
↓
锁屏
```

以及晚上：

```text
打开 Miro
↓
都已经在那里
```

---

# Future 1 — 原生 iOS

只有 Web App 真的好用以后才考虑。

原生 App 未来主要为了：

```text
Widget
Lock Screen Control
Control Center
Action Button
更强的系统级入口
```

不是为了重新发明 Capture。

---

# Future 2 — Melody Fragment

未来：

```text
突然想到旋律
↓
系统入口
↓
直接录音
↓
Melody Fragment
```

不默认转文字。

---

# Future 3 — Song

```text
Text Fragment ───┐
                 ├──→ Song
Melody Fragment ─┘
```

Song 属于 Compose。

不进入 V0。

---

# 产品原则

> **不要让整理行为杀死灵感发生本身。**

> **Capture 负责留下，Compose 负责决定意义。**

> **语言来了，就留下文字；旋律来了，就留下声音。**

> **iPhone 是口袋里的便利贴，Miro 是墙。**

---

# V0 LOCK

最终：

```text
Fragments                              ↗
```

链路：

```text
打开 Live Lyrics Web App
↓
写一句
↓
↗
↓
Miro Sticky
```

**Web App。**

**ChatGPT Sites 优先部署。**

**不依赖 Drafts。**

**不依赖原生 iOS。**

**不加任何东西。**
