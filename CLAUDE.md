# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ミラノ2026冬季オリンピックのニュース動画速報サイト。単一のHTMLファイル（index.html）で構成され、外部APIからニュースデータを取得して動的に表示する。

## Development

### Running the Site
ブラウザで `index.html` を直接開く（サーバー不要）。

### Testing API
```bash
curl -s -H "x-api-key: E58jesAEI22lCer7orcqw0h6FkMQFCw2fGr1oywa" \
  "https://to232fd3h5.execute-api.ap-northeast-1.amazonaws.com/prd/newslist?page=1&per_page=5"
```

## Architecture

### Single-File Structure
- `index.html` - HTML、CSS（Tailwind）、JavaScriptをすべて含む単一ファイル
- `html/code.html` - デザインテンプレート（参照用）

### API Integration
- **Endpoint**: `https://to232fd3h5.execute-api.ap-northeast-1.amazonaws.com/prd/newslist`
- **Auth Header**: `x-api-key`
- **Parameters**: `page`, `per_page`, `sort`, `order`
- **Response Fields**:
  - `mp4_url` - 動画の署名付きS3 URL
  - `text` - ニュース見出し
  - `published_at` - 公開日時

### Key Features
- 日付ナビゲーション（ヘッダー内、全データから日付抽出）
- ニュースカード（video要素でサムネイル表示）
- ページネーション（初期20件表示、「もっと見る」で追加読み込み）
- 動画モーダル（カードクリックでフル動画再生）

### Styling
- Tailwind CSS（CDN経由）
- Google Fonts: Lexend, Noto Sans JP
- Material Symbols Outlined（アイコン）
- カスタムカラー: primary (#0d59f2), navy (#0a1a3c), ice-blue (#f0f7ff)
