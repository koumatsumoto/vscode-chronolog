# 開発環境セットアップ

## 必要なパッケージのインストール

```bash
npm install
```

## ビルド・パッケージ

本プロジェクトは [Vite](https://vitejs.dev/) をバンドラとして利用しています。

### .vscodeignore について

拡張機能のパッケージング時に不要なファイルを除外するため、`.vscodeignore` を Vite 用に更新しています。  
主な無視対象は以下の通りです。

- Vite 設定ファイル（vite.config.ts, vite.config.mjs, vite.config.mts）
- ビルド成果物（out/\*\*）
- 開発用ディレクトリやテストコード（.vscode/**, .vscode-test/**, src/test/\*\*）
- node_modules/\*\*
- 設定ファイルやドキュメント（.env, .env.\*, README.md, docs/\*\* など）

### ビルド

```bash
npm run compile
```

### パッケージ作成

```bash
npm run package
```

## VS Code の推奨拡張機能

以下の拡張機能をインストールすることで、開発効率が向上します：

- ESLint
- Extension Test Runner
- TSLint Problem Matcher
