![Live Ideas — type on your phone, send to Miro](./docs/assets/readme/hero.png)

<p align="center">
  <strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a> · <a href="./README.ja.md">日本語</a>
</p>

# Live Ideas

**Send text from your phone directly to a Miro board.**

## How it works

**01 — Type**  
Open Live Ideas and write your idea.

**02 — Send**  
Tap Send.

**03 — Miro**  
The text appears as a Sticky Note on your configured Miro board.

That's it.

If sending fails, the original text stays in Capture so you can retry. **Fragments** keeps a local history of successfully sent text on the current device.

## Use it

- [Usage guide](./docs/USAGE.md)
- [简体中文使用教程](./docs/USAGE.zh-CN.md)
- [日本語の使い方](./docs/USAGE.ja.md)
- [Setup & deployment](./docs/SETUP.md)

## Quick start

Requirements: Node.js **22.13+**, a Miro token with `boards:read` and `boards:write`, and one target Miro board.

```bash
git clone https://github.com/Dachi2333/live-ideas.git
cd live-ideas
npm ci
npm test
npm run build
```

For self-hosting, follow [Setup & deployment](./docs/SETUP.md). Miro credentials stay on the server and are never shipped in browser JavaScript.

## Docs

[Architecture](./docs/ARCHITECTURE.md) · [Security](./docs/SECURITY.md) · [PRD](./docs/PRD.md) · [Project outline](./docs/OUTLINE.md)

## License

MIT — see [LICENSE](./LICENSE).

---

<sub>Live Ideas is an independent open-source project and is not affiliated with Miro.</sub>
