# Live Ideas

[English](./README.md) · [简体中文](./README.zh-CN.md) · **日本語**

> **Capture now. Organize later. — まず残して、整理はあとで。**

Live Ideas は、スマートフォンから Miro へアイデアや観察メモをすばやく送るための、ミニマルな Capture ツールです。開いて、書いて、Send。送信に成功した内容は、設定済みの Miro Board に Sticky Note として追加されます。

**iPhone はポケットの付箋、Miro は壁。**

```text
アイデアが浮かぶ
→ Live Ideas を開く
→ 書く
→ Send
→ Miro Sticky
→ 整理はあとでデスクトップから
```

Live Ideas は、ノートアプリやプロジェクト管理ツール、Miro の代替を目指していません。V1 の目的はただ一つ、**「思いつく」から「確実に残る」までの摩擦を減らすこと**です。

## V1 の機能

- **Capture** — テキスト入力と Send だけに集中した画面。
- **安全な送信** — Miro での作成とローカルの Sent 保存が完了するまで入力内容を消しません。
- **Failed → Retry** — ネットワークや API の失敗時も原文を保持し、そのまま再送できます。
- **Fragments** — この端末で送信に成功した内容を新しい順に確認できます。
- **6 行プレビュー** — 長文は Fragments 上では最大 6 行に抑えますが、全文は保持されます。
- **ローカル削除** — Fragment を左へスワイプすると端末側の履歴だけを削除できます。**Miro の Sticky は削除されません。**
- **指に追従する画面切り替え** — Capture ↔ Fragments は横スワイプに合わせて動きます。
- **Board を見た配置** — サーバーが既存 Sticky の位置を読み、重なりにくい空き位置を選びます。
- **Secret はサーバー側** — Miro Access Token をブラウザの JavaScript に含めません。

## アーキテクチャ

```text
スマートフォン / ブラウザ
├─ Capture UI
├─ localStorage
│  ├─ 現在の Draft
│  └─ 送信済み Fragments 履歴
└─ POST /api/fragments
       ↓
同一オリジンの Worker
├─ 認証
├─ サーバー側の Miro Secret
└─ Miro client + 配置処理
       ↓
設定した Miro Board
└─ Sticky Note
```

詳しくは [Architecture](./docs/ARCHITECTURE.md) を参照してください。

## クイックスタート

必要なもの：

- Node.js **22.13+**
- `boards:read` と `boards:write` 権限を持つ Miro App / Token
- 送信先にする Miro Board 1 つ

```bash
git clone https://github.com/Dachi2333/live-ideas.git
cd live-ideas
npm ci
npm test
npm run build
```

設定とデプロイの詳細は [Setup](./docs/SETUP.md) にあります。

## デプロイ方法

### ChatGPT Sites

メンテナーのプライベート環境では ChatGPT Sites を使い、サーバー側に以下を設定します。

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
OWNER_EMAIL
```

`OWNER_EMAIL` と Sites の認証済みユーザーのメールアドレスを照合するため、owner-only の dogfood に向いています。

### Cloudflare Workers でセルフホスト

オープンソース版では、Cloudflare Workers を使った再現可能な self-host 手順を用意しています。

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
SELF_HOST_PASSWORD
```

`SELF_HOST_PASSWORD` を設定すると、アプリ全体が HTTP Basic Authentication で保護されます。ユーザー名は固定で：

```text
liveideas
```

十分に長くユニークなパスワードを使い、HTTPS 上でのみ利用してください。詳しくは [Setup](./docs/SETUP.md) と [Security](./docs/SECURITY.md) を参照してください。

## 使い方

日本語の詳しい操作ガイド：[docs/USAGE.ja.md](./docs/USAGE.ja.md)

基本操作はシンプルです。

1. **Capture** を開く。
2. `Type your idea...` に入力する。
3. Send をタップする。
4. 通信中は `Sending...` が表示される。
5. 成功すると `Your idea was sent to Miro` が短時間表示され、Capture が空になる。
6. 失敗した場合は原文を残したまま `Failed to send. Tap to retry.` と Retry 操作が表示される。

他の言語：

- [English usage guide](./docs/USAGE.md)
- [简体中文使用教程](./docs/USAGE.zh-CN.md)

## データとプライバシー

- 現在の Draft と Fragments 履歴は、このブラウザの `localStorage` に保存されます。
- V1 には端末間同期がないため、Fragments は端末 / ブラウザごとの履歴です。
- 送信に成功した Capture テキストは、同一オリジンの Worker を経由して設定済み Miro Board に送られます。
- Fragment のローカル削除は、対応する Miro Sticky を削除しません。
- Live Ideas にはデフォルトでアクセス解析を組み込んでいません。
- 実際の Miro Token、Board ID、パスワード、`.env`、`.dev.vars` は Git にコミットしないでください。

詳しくは [Security](./docs/SECURITY.md) を参照してください。

## V1 に含めないもの

V1 は **Text Capture only** です。

AI、タグ、フォルダー、検索、プロジェクト管理、複数の送信先、音声、写真 / カメラ、ネイティブアプリ、複雑なクラウド同期は含みません。

V2 の最有力候補は、展示会・Workshop・店舗調査・Field Research 向けの **Photo + Comment → Miro** です。

## 開発

```bash
npm run dev
npm test
npm run build
npm run preview
```

テストでは、Capture の信頼性、ローカル保存と旧データ移行、Fragments の削除、UI contract、API 認証、Miro の配置処理、self-host 認証を確認しています。

## ドキュメント

- [PRD](./docs/PRD.md)
- [プロジェクト概要](./docs/OUTLINE.md)
- [Setup](./docs/SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Security](./docs/SECURITY.md)
- [実機 Acceptance](./docs/DEVICE_ACCEPTANCE.md)

## License

Live Ideas は [MIT License](./LICENSE) のもとで公開されています。
