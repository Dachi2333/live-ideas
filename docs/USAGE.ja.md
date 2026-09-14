# Live Ideas — 使い方

[English](./USAGE.md) · [简体中文](./USAGE.zh-CN.md) · **日本語**

Live Ideas が役立つのは、**「今これを残したい」と思った瞬間**です。

思いついたことや現場で気づいたことを、分類や整理を考える前に Miro へ送るための Capture ツールです。

Capture の時点では、タイトル、タグ、フォルダー、プロジェクト名を決める必要はありません。

## 1. 2 つの画面

普段使う画面は 2 つだけです。

- **Capture** — 新しい idea / observation を書いて送る画面。
- **Fragments** — この端末から過去に送信成功した内容を確認する画面。

画面下のタブをタップするか、左右にスワイプして切り替えます。

横スワイプでは画面とオレンジ色の indicator が指の動きに追従します。切り替えに必要な距離まで動かさずに指を離した場合は、元の画面へ戻ります。

## 2. アイデアを Capture する

1. **Capture** を開きます。
2. キーボードが開いていなければ、大きな入力エリアをタップします。
3. 次の入力欄に書きます。

   ```text
   Type your idea...
   ```

4. 右下の丸い Send ボタンをタップします。

送信中は：

```text
Sending...
```

と表示されます。

通信が完了するまでは、Send を押しただけで原文が消えることはありません。また、すでに送信処理中の場合、連打しても同じ内容の追加リクエストは作られません。

## 3. Send のあとに何が起きるか

送信成功までの流れは次の通りです。

```text
Capture のテキスト
→ ローカルの安全コピー
→ 同一オリジンの /api/fragments
→ サーバー側から Miro API
→ Miro Sticky 作成成功
→ ローカル Sent 状態を保存
→ Capture を空にする
```

成功すると短時間：

```text
Your idea was sent to Miro
```

と表示され、その後 Capture が空になって次の入力ができる状態になります。

## 4. 送信に失敗した場合

ネットワーク切断、Miro API の失敗、認証や設定の問題があっても、**元のテキストは保持されます**。

一般的な失敗状態では：

```text
Failed to send. Tap to retry.
```

と表示されます。

Retry icon をタップすると、保持されている同じテキストを再送します。

設定に関係する問題では、次のようなメッセージが表示されることがあります。

- `This Site isn’t authorized for sending.`
- `Miro setup is not configured yet.`
- `Couldn’t save locally. Keep this page open.`

ローカル保存に失敗したという警告が出た場合は、内容を別の安全な場所へコピーするか、ブラウザの保存問題を解決するまでページを閉じないでください。

## 5. Fragments

**Fragments** を開くと、このブラウザから送信に成功したテキストを確認できます。

Fragments は：

- 新しいものが上に表示される；
- このブラウザのローカルに保存される；
- 編集や整理のためではなく「送信履歴」を確認するための画面です。

各 Fragment には本文と送信時刻が表示されます。

### 長いテキスト

長文は一覧上で最大 **6 行**まで表示します。

1 件の Fragment が画面全体を占有しないための表示上の制限で、元の全文はローカルに保持されています。

## 6. Fragment をこの端末の履歴から削除する

1. **Fragments** を開きます。
2. 削除したい Fragment を左へスワイプします。
3. 右側に赤い削除エリアが表示されます。
4. ゴミ箱 icon をタップします。

同時に開ける削除エリアは 1 件だけです。別の Fragment を開くと、前のものは自動で閉じます。

**重要：この操作で消えるのはブラウザ内の Fragments 履歴だけです。すでに Miro に作成された Sticky は削除・編集・移動されません。**

## 7. Capture ↔ Fragments のスワイプ

画面切り替えには 2 つの方法があります。

- 下部の **Capture** / **Fragments** をタップする。
- ページを横方向へドラッグする。

横ドラッグ中は、ページとオレンジ色の active indicator がリアルタイムで指に追従します。

長文や Fragments リストの縦スクロールと、ページ切り替えの横スワイプは分けて扱われます。

## 8. iPhone のホーム画面に追加する

よりアプリに近い使い方にする場合：

1. デプロイ済みの Live Ideas URL を **Safari** で開きます。
2. Safari の **共有**ボタンをタップします。
3. **ホーム画面に追加**を選びます。
4. 名前を確認して **追加**をタップします。
5. 以後はホーム画面の Live Ideas icon から起動します。

Live Ideas には standalone Web App 用の metadata が設定されているため、ホーム画面から起動すると通常のブラウザ UI の多くが非表示になります。

## 9. データはどこに保存されるか

### 現在の Draft

まだ送信していない Capture 内容はブラウザの `localStorage` に保存されます。

ページの再読み込み、Safari のバックグラウンド移行など、一般的な状況で内容をできるだけ保持するためです。

### Fragments 履歴

送信成功した Fragments もブラウザの `localStorage` に保存されます。

V1 には端末間同期がありません。たとえば iPhone の Safari と PC の Chrome が同じ Miro Board に送っていても、ローカルの Fragments 履歴は別々です。

### Miro

Send したテキストは、まず Live Ideas 自身の同一オリジン server endpoint へ送られます。サーバーが設定済みの Miro credential を使い、対象 Board に Sticky を作成します。

Miro Access Token はブラウザ JavaScript には保存されません。

## 10. 旧 Live Lyrics からの移行

以前のプライベート版は `live-lyrics:*` という localStorage key を使っていました。

Live Ideas は、有効な旧 Capture / Fragments データを初回検出時に `live-ideas:*` へ移行します。

新旧両方の key が存在する場合は新しい Live Ideas 側のデータを優先します。

移行では、**新しい key への書き込みに成功してから旧 key を削除**します。新しい key の保存に失敗した場合、旧データを意図的に消さない設計です。

## 11. トラブルシューティング

### Send を押したのに Miro に出てこない

次の順で確認してください。

1. `Sending...` が終わるまで待つ。
2. Retry が表示されたら、ネットワーク接続を確認して 1 回再送する。
3. デプロイ環境に有効な `MIRO_ACCESS_TOKEN` と `MIRO_BOARD_ID` があるか確認する。
4. Miro token に `boards:read` と `boards:write` が残っているか確認する。
5. 対象 Board が存在し、token からアクセスできるか確認する。

### `This Site isn’t authorized for sending.` と表示される

ChatGPT Sites モードでは、現在 Sites にログインしているユーザーのメールアドレスが `OWNER_EMAIL` と一致している必要があります。

Cloudflare self-host モードでは HTTP Basic Authentication を使います。

```text
username: liveideas
password: 設定した SELF_HOST_PASSWORD
```

### `Miro setup is not configured yet.` と表示される

サーバー側に必要な runtime 値が不足しています。[SETUP.md](./SETUP.md) を確認してください。

### 開いた直後にユーザー名とパスワードを求められる

Cloudflare self-host では正常です。

ユーザー名は `liveideas`、パスワードはサーバー側の `SELF_HOST_PASSWORD` です。

Miro のパスワードや Miro Token を Basic 認証用パスワードとして使い回さないでください。

### 別の端末で Fragments が見えない

V1 では正常です。Fragments は端末 / ブラウザごとの簡易履歴であり、クラウド同期データベースではありません。

後から整理する共有先は Miro です。

### Fragment を削除したのに Miro には残っている

正常です。Live Ideas の Delete はローカル履歴のみを対象にしています。

### ブラウザデータを削除したら Draft が消えた

`localStorage` はブラウザプロファイルに属します。サイトデータの削除、プライベートブラウズのライフサイクル、ブラウザ側の保存制限などで消えることがあります。

Live Ideas は意図しないデータ消失を減らす設計ですが、クラウドバックアップサービスではありません。

## 12. 向いている利用シーン

「まず残して、意味付けや整理はあとで」という場面に向いています。

- 個人のアイデア / 文章の断片；
- 展示会・見本市での観察メモ；
- Workshop；
- 店舗視察や競合調査；
- CMF / プロダクトデザインのリサーチ；
- Field Research。

現在の V1 はテキストのみです。**Photo + Comment → Miro** は今後の候補であり、このリリースには含まれません。
