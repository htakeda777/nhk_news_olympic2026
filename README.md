# ミラノ2026 動画ニュース速報

ミラノ・コルティナ2026冬季オリンピック関連ニュースを動画で表示するフロントエンドと、ニュース一覧を返す Lambda API のリポジトリです。

## 構成

- `index.html`: 画面レイアウト
- `css/style.css`: スタイル
- `js/app.js`: API取得、一覧描画、日付フィルタ、モーダル再生
- `api/lambda.py`: ニュース一覧 API（MySQL `messages` テーブルを検索）
- `api/table.sql`: `messages` テーブル定義

## 動かし方

静的サイトなので、`index.html` をブラウザで開けば表示できます。

## API

- Endpoint: `https://to232fd3h5.execute-api.ap-northeast-1.amazonaws.com/prd/newslist`
- Header: `x-api-key`
- `per_page` の実効上限は API 側で `100`（それ以上を指定しても `100` に丸められる）
- 主なクエリ:
  - `page`
  - `per_page`
  - `sort` (`published_at` など)
  - `order` (`asc` / `desc`)
  - `search_text`（スペース区切り OR 検索）

例:

```bash
curl -s -H "x-api-key: <YOUR_API_KEY>" \
  "https://to232fd3h5.execute-api.ap-northeast-1.amazonaws.com/prd/newslist?page=1&per_page=5"
```

## 画面表示ルール

- フロント表示対象は `category === 1` の親レコードのみ。
- 動画URLは次の優先順で決定:
  1. `children` 内で `supervised = 1` の子を候補化
  2. 候補の中から `no` が最大（最新）の子を選択
  3. 選択子に `mp4_url` があればそれを表示
  4. 条件不成立時は親の `mp4_url` を表示
- このルールはカード動画とモーダル再生の両方に適用。
- 見出し (`text`) と日時 (`published_at`) は親レコードの値を表示。

## 補足

- `api/lambda.py` は親レコード（`parent_id IS NULL`）を返し、必要に応じて `children` 配列を付与します。
- フロントは受け取った `children` を使って表示動画のみ差し替えます。
- 本サイトはオリンピック速報用途のため、表示対象は最大100件で運用します（直近ニュース重視）。
