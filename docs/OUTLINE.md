# Lyric Capture — 项目大纲 v1

## 一句话

一个只干一件事的小工具：

> **在 iPhone 上写下一句歌词，点一下发送，它就自动出现在固定 Miro Board 里成为一张便利贴。**

---

# 为什么做

现在的流程太烦：

```text
想到一句
↓
Apple Notes
↓
以后找出来
↓
复制
↓
打开 Miro
↓
粘贴
↓
整理
↓
删掉旧 Notes
```

真正的问题不是没有工具。

而是：

> **记录灵感和整理灵感被绑在了一起。**

Lyric Capture 把两件事彻底拆开。

---

# 正确流程

```text
现在
想到一句
↓
iPhone 输入
↓
↗
↓
结束


以后
打开 Miro
↓
所有句子已经在墙上
↓
拖
拼
删
改
↓
写成完整歌词
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

只有两个入口：

- `Fragments`
- `↗`

没有第三个。

---

# ↗ 做什么

点击后：

```text
当前文本
↓
Miro API
↓
固定 Lyrics Board
↓
生成 Sticky Note
↓
本地标记 Sent
↓
输入框恢复为空
```

如果发送失败：

```text
失败
↓
原文字还在
↓
绝对不能丢
```

---

# Fragments 是什么

不是笔记系统。

只是：

> **我以前成功扔出去过什么？**

简单列表：

```text
我不想死后没人记得我
Today 17:42

我的真实是真的真实吗
Today 16:18

我连无法接受自己的自己……
Yesterday
```

作用：

- 不打开 Miro 也能回看；
- 当安全备份；
- 确认自己已经发送过什么。

不用于分类、整理、写完整歌词。

---

# Miro 是什么

Miro 是真正的创作墙。

每句话进去以后变成一张 Sticky：

```text
┌────────────┐  ┌────────────┐
│ fragment A │  │ fragment B │
└────────────┘  └────────────┘

      ┌────────────┐
      │ fragment C │
      └────────────┘
```

以后集中创作时：

- 拖到一起；
- 重新组合；
- 删除；
- 改写；
- 找 Hook；
- 拼 Verse。

这些都不属于 Capture App。

---

# V0 不做什么

不做：

```text
AI
分类
Tag
Folder
Song Project
Verse / Hook
搜索
录音
语音转文字
图片
多个 Board
多个平台
Android
社交
协作
自动写歌词
```

一句话：

> **只负责把一句话贴到墙上。**

---

# 技术结构

```text
iPhone Capture
      │
      ├── Local Fragments
      │
      └── ↗
           ↓
       Miro API
           ↓
      Lyrics Board
           ↓
        Sticky
```

---

# 权限

尽量只要：

```text
网络
Miro Board 写入
本地保存
```

不要：

```text
相机
照片
麦克风
定位
通讯录
日历
```

Token / Secret 绝对不进 GitHub。

---

# 开发方式

这次故意试：

```text
GitHub
  ↓
Codex Cloud
  ↓
线上开发
  ↓
公司电脑浏览器也能看 / 改 / review
  ↓
iPhone 真机验收
```

GitHub 是 Source of Truth。

本地电脑不是必须开发入口。

---

# 真正要测试的不是“能不能写出来”

而是：

> **它会不会真的成为我想到一句歌词时的第一反应。**

成功标准：

```text
掏手机
↓
打开
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
便利贴已经在那里
```

---

# 产品原则

> **不要让整理行为杀死灵感发生本身。**

> **灵感发生时，不要求灵感负责整理自己。**

> **Capture 负责留下，Compose 负责决定意义。**

> **iPhone 是口袋里的便利贴，Miro 是墙。**

---

# V0 LOCK

最终只有：

```text
Fragments    ↗
```

不加任何东西。
