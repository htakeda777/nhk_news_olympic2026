# ミラノ2026 動画ニュース速報

ミラノ・コルティナ2026冬季オリンピック / パラリンピック関連ニュースを動画で表示するフロントエンドと、ニュース一覧を返す Lambda API のリポジトリです。

## 構成

- `index.html`: オリンピック向け画面レイアウト
- `paralympic.html`: パラリンピック向け画面レイアウト
- `css/style.css`: スタイル
- `js/app.js`: API取得、一覧描画、日付フィルタ、モーダル再生（両HTMLで共通利用）
- `api/lambda.py`: ニュース一覧 API（MySQL `messages` テーブルを検索）
- `api/table.sql`: `messages` テーブル定義

## 動かし方

静的サイトなので、ブラウザで対象HTMLを直接開けば表示できます。

- `index.html`: オリンピックニュース
- `paralympic.html`: パラリンピックニュース

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
  - `date_from`（取得開始日）
  - `date_to`（取得終了日）

例:

```bash
curl -s -H "x-api-key: <YOUR_API_KEY>" \
  "https://to232fd3h5.execute-api.ap-northeast-1.amazonaws.com/prd/newslist?page=1&per_page=5"
```

## 画面表示ルール

- `index.html` と `paralympic.html` は同じ `js/app.js` を利用します。
- 各HTMLは `window.APP_CONFIG` で取得期間を指定します。
  - オリンピック: `2026-02-06` から `2026-02-23`
  - パラリンピック: `2026-03-06` から `2026-03-16`
- デフォルト検索キーワードは `金 銀 銅`（スペース区切り OR 検索）です。
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
