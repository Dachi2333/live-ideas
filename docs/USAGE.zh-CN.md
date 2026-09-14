# Live Ideas — 使用教程

[English](./USAGE.md) · **简体中文** · [日本語](./USAGE.ja.md)

Live Ideas 只为一个瞬间服务：**你突然想到或看到某个值得留下的东西，希望它在消失之前可靠地进入 Miro。**

Capture 阶段不用命名、分类、Tag，也不用先想清楚它属于哪里。

## 1. 两个日常页面

Live Ideas 只有两个主要页面：

- **Capture**：写下一条新的 idea / observation 并发送。
- **Fragments**：查看这个设备以前成功发送过什么。

可以点击底部的 Tab，也可以左右横滑切换。

横滑是跟手的：页面和底部橙色 indicator 会随着手指移动；如果松手时没有达到切页阈值，页面会回弹。

## 2. Capture 一条想法

1. 打开 **Capture**。
2. 如果键盘没有自动出现，点击大输入区域。
3. 在下面这个输入框里写内容：

   ```text
   Type your idea...
   ```

4. 点击右下角圆形 Send 按钮。

发送进行中会显示：

```text
Sending...
```

在请求结束之前，原始文本不会因为点击 Send 而被提前清掉。发送已经进行中时连续点击也不会再创建第二个重复请求。

## 3. Send 后发生了什么

成功流程是：

```text
Capture 文本
→ 本地安全副本
→ 同源 /api/fragments
→ 服务端调用 Miro API
→ Miro Sticky 创建成功
→ 本地 Sent 状态保存成功
→ Capture 清空
```

成功时会短暂显示：

```text
Your idea was sent to Miro
```

随后输入区恢复为空，可以继续 Capture 下一条。

## 4. 发送失败怎么办

断网、弱网、Miro API 错误，或者部署配置 / 授权出错时，**Live Ideas 会保留你的原文**。

普通失败状态会显示：

```text
Failed to send. Tap to retry.
```

点击 Retry icon，会用当前保存的原文重新发送。

部分配置问题会显示更明确的文案，例如：

- `This Site isn’t authorized for sending.`
- `Miro setup is not configured yet.`
- `Couldn’t save locally. Keep this page open.`

如果出现本地保存失败提示，先不要关闭页面。确认文本已经复制到安全位置，或解决浏览器存储问题以后再离开。

## 5. Fragments

打开 **Fragments**，可以查看这个浏览器以前成功发送过的文本。

Fragments：

- newest-first，最新的在最前面；
- 存在当前浏览器本地；
- 是“发送历史”，不是第二套编辑 / 整理系统。

每条会显示文本和发送时间。

### 长文本

长 Fragment 在列表中最多显示 **6 行**，避免一条内容占掉整个屏幕。

这个限制只是 UI 显示规则，完整文本仍然保存在本地记录中。

## 6. 删除本地 Fragment

如果只是不想在这台设备的历史里继续看到某条记录：

1. 打开 **Fragments**。
2. 向左滑一条 Fragment。
3. 右侧出现红色删除区域。
4. 点击垃圾桶 icon。

任意时刻最多只会展开一个删除区域；打开另一条时，上一条会自动收回。

**重要：这里只删除浏览器本地的 Fragments 历史。不会删除、修改或移动 Miro 中已经创建好的 Sticky。**

## 7. Capture ↔ Fragments 横滑

切页有两种方式：

- 点击底部 **Capture** / **Fragments**；
- 在页面上横向拖动。

横向拖动时，两个页面与橙色 active indicator 都会实时跟随手指。

纵向滚动（例如长文本、Fragments 列表）和横向切页是分开的，正常的上下滚动不应该触发页面切换。

## 8. 添加到 iPhone 主屏幕

想让它更接近独立 App 的使用方式，可以：

1. 用 **Safari** 打开已经部署好的 Live Ideas URL。
2. 点击 Safari 的 **分享**按钮。
3. 选择 **添加到主屏幕**。
4. 确认名称后点击 **添加**。
5. 以后直接从主屏幕的 Live Ideas icon 打开。

Live Ideas 已配置 standalone Web App metadata，因此从主屏幕打开时会隐藏大部分普通浏览器 UI。

## 9. 数据存在哪里

### 当前 Draft

尚未发送的 Capture 内容会存进浏览器 `localStorage`，用于尽可能抵抗：

- 页面刷新；
- Safari 切后台再回来；
- Web App 暂时关闭；
- 网络失败。

### Fragments 历史

成功发送过的 Fragments 也保存在浏览器 `localStorage`。

V1 **没有跨设备同步**。比如 iPhone Safari 和电脑 Chrome 即使都往同一个 Miro Board 发送，它们的本地 Fragments 历史也可能完全不同。

### Miro

发送时，文本会先发到当前站点自己的同源 server endpoint，再由服务端使用配置好的 Miro 凭据创建 Sticky。

Miro Access Token 不会放进浏览器 JavaScript。

## 10. 从旧 Live Lyrics 版本升级

早期私人版本使用 `live-lyrics:*` 作为 localStorage key。

新的 Live Ideas 会在第一次发现旧数据时，把有效的 Capture / Fragments 迁移到 `live-ideas:*`。

如果新旧两代 key 同时存在，新版数据优先。

迁移顺序是：**先写入新 key，成功后再移除旧 key**。如果新 key 写入失败，不会主动删掉旧数据。

## 11. 常见问题

### 点击 Send，但 Miro 里没有东西

依次检查：

1. 等 `Sending...` 状态结束。
2. 如果出现 Retry，确认网络后再试一次。
3. 确认部署环境里存在有效的 `MIRO_ACCESS_TOKEN` 与 `MIRO_BOARD_ID`。
4. 确认 Miro token 仍然拥有 `boards:read` 和 `boards:write`。
5. 确认目标 Board 还存在，并且 token 对它有权限。

### 显示 `This Site isn’t authorized for sending.`

ChatGPT Sites 模式下，当前登录 Sites 的用户邮箱必须与 `OWNER_EMAIL` 匹配。

Cloudflare self-host 模式下则使用 HTTP Basic Authentication：

```text
username: liveideas
password: 你配置的 SELF_HOST_PASSWORD
```

### 显示 `Miro setup is not configured yet.`

服务端缺少必要 runtime 配置。参见 [SETUP.md](./SETUP.md)。

### 页面一打开就要求用户名和密码

如果是 Cloudflare self-host，这是正常的保护层。

用户名固定是 `liveideas`，密码是服务端设置的 `SELF_HOST_PASSWORD`。

不要把 Miro 密码或 Miro Token 当成这个密码来重复使用。

### 换了手机 / 浏览器，Fragments 不见了

V1 就是这样设计的：Fragments 是当前设备 / 浏览器的便利历史，不是云同步数据库。

真正作为后续工作空间的是 Miro。

### 我删掉 Fragment 了，但 Miro 里还在

正常。Live Ideas 的 Delete 只删除本机历史，不负责反向控制 Miro。

### 清理浏览器数据之后 Draft 没了

`localStorage` 属于浏览器本身。清除网站数据、某些隐私浏览生命周期或浏览器的存储限制都会影响它。

Live Ideas 尽量避免意外丢内容，但它不是云备份系统。

## 12. 推荐使用场景

最适合 Live Ideas 的，是“先留下，之后才解释意义”的场景，比如：

- 个人 idea / 写作片段；
- 展会 / 展览中的即时观察；
- Workshop；
- 店铺观察、竞品调研；
- CMF / 工业设计案例记录；
- Field Research。

当前 V1 只处理文本。**Photo + Comment → Miro** 属于下一阶段方向，不在本版功能范围内。
