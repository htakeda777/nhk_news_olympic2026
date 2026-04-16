# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ミラノ2026冬季オリンピック / パラリンピックのニュース動画速報サイト。`index.html` と `paralympic.html` が共通の `js/app.js` を使い、外部APIからニュースデータを取得して動的に表示する。

## Development

### Running the Site
ブラウザで対象HTMLを直接開く（サーバー不要）。

- `index.html`: オリンピックニュース
- `paralympic.html`: パラリンピックニュース

### Testing API
```bash
curl -s -H "x-api-key: E58jesAEI22lCer7orcqw0h6FkMQFCw2fGr1oywa" \
  "https://to232fd3h5.execute-api.ap-northeast-1.amazonaws.com/prd/newslist?page=1&per_page=5"
```

## Architecture

### File Structure
- `index.html` - オリンピック向けHTMLマークアップ（Tailwind CSSクラス使用）
- `paralympic.html` - パラリンピック向けHTMLマークアップ（Tailwind CSSクラス使用）
- `css/style.css` - カスタムCSS（Tailwind `@apply` 含む）
- `js/app.js` - 共通アプリケーションロジック（API通信、レンダリング、モーダル等）
- `html/code.html` - デザインテンプレート（参照用）

### API Integration
- **Endpoint**: `https://to232fd3h5.execute-api.ap-northeast-1.amazonaws.com/prd/newslist`
- **Auth Header**: `x-api-key`
- **Parameters**: `page`, `per_page`, `sort`, `order`, `search_text`, `date_from`, `date_to`
- **Pagination Note**: `per_page` は API 側で最大 `100` に制限される（速報用途として100件運用）
- **Response Fields**:
  - `mp4_url` - 動画の署名付きS3 URL
  - `text` - ニュース見出し
  - `published_at` - 公開日時
  - `category` - カテゴリID（1のみ表示対象）

### 動画表示条件
- `index.html` と `paralympic.html` は `window.APP_CONFIG` で取得期間を切り替える。
  - オリンピック: `date_from: '2026-02-06'`, `date_to: '2026-02-23'`
  - パラリンピック: `date_from: '2026-03-06'`, `date_to: '2026-03-16'`
- `window.APP_CONFIG` が未設定の場合、`js/app.js` はオリンピック期間をフォールバックとして使う。
- 画面表示対象は `category === 1` の親レコード。
- APIレスポンスの `children`（子レコード）を参照し、`supervised = 1` の子のみ候補にする。
- 候補が複数ある場合は `no` が最大の子（最新）を採用する。
- 採用した子に `mp4_url` がある場合、そのURLを表示動画として使う。
- 子が存在しない / `supervised = 1` がない / 採用子に `mp4_url` がない場合は、親レコードの `mp4_url` を使う。
- この判定はニュースカードと動画モーダルの両方に同じルールで適用する。
- `text` と `published_at` は親レコードの値を表示し、子レコードで上書きしない。

#### 判定ロジック（擬似コード）
```javascript
effectiveVideoUrl = parent.mp4_url
latest = max_by_no(parent.children where supervised == 1)
if (latest && latest.mp4_url) effectiveVideoUrl = latest.mp4_url
```

### Key Features
- カテゴリフィルタリング（`category === 1` のニュースのみ表示）
- オリンピック / パラリンピック切り替えナビゲーション
- HTMLごとの取得期間設定（`window.APP_CONFIG`）
- デフォルト検索キーワード（`金 銀 銅`、OR検索）
- 日付ナビゲーション（ヘッダー内、全データから日付抽出）
- ニュースカード（video要素でサムネイル表示）
- ページネーション（初期20件表示、「もっと見る」で追加読み込み）
- 動画モーダル（カードクリックでフル動画再生）

### Styling
- Tailwind CSS（CDN経由）
- Google Fonts: Lexend, Noto Sans JP
- Material Symbols Outlined（アイコン）
- カスタムカラー: primary (#0d59f2), navy (#0a1a3c), ice-blue (#f0f7ff)
