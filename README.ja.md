![Live Ideas — スマートフォンから Miro へ](./docs/assets/readme/hero.png)

<p align="center">
  <a href="./README.md">English</a> · <a href="./README.zh-CN.md">简体中文</a> · <strong>日本語</strong>
</p>

# Live Ideas

**スマートフォンで入力したテキストを、そのまま指定した Miro Board に送ります。**

## 使い方

**01 — 入力**  
Live Ideas を開き、アイデアを書く。

**02 — 送信**  
Send をタップする。

**03 — Miro**  
テキストが設定済みの Miro Board に Sticky Note として表示されます。

これだけです。

送信に失敗しても原文は残るので、そのまま Retry できます。**Fragments** には、この端末で送信に成功した履歴がローカル保存されます。

## 利用ガイド

- [日本語の使い方](./docs/USAGE.ja.md)
- [English usage guide](./docs/USAGE.md)
- [简体中文使用教程](./docs/USAGE.zh-CN.md)
- [Setup & deployment](./docs/SETUP.md)

## Quick start

必要なものは Node.js **22.13+**、`boards:read` / `boards:write` 権限を持つ Miro Token、送信先の Miro Board 1 つです。

```bash
git clone https://github.com/Dachi2333/live-ideas.git
cd live-ideas
npm ci
npm test
npm run build
```

セルフホストは [Setup & deployment](./docs/SETUP.md) を参照してください。Miro の認証情報はサーバー側だけに保持され、ブラウザ JavaScript には含まれません。

## Docs

[Architecture](./docs/ARCHITECTURE.md) · [Security](./docs/SECURITY.md)

## License

MIT — [LICENSE](./LICENSE) を参照してください。

---

<sub>Live Ideas は独立したオープンソースプロジェクトであり、Miro とは提携していません。</sub>