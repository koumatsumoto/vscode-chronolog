# 開発手順

## セットアップ

1. 必要なパッケージをインストール:

```bash
npm install
```

2. VS Code の推奨拡張機能をインストール:

- ESLint
- Extension Test Runner
- TSLint Problem Matcher

## 開発フロー

### Lint チェック

以下コマンドで ESLint による静的解析を実行できます。  
**警告 (warning) もエラーとして扱われ、1件でも警告があるとエラー終了します。**

```bash
npm run lint
```

### コードフォーマット

以下コマンドを実行することで、プロジェクト内の全てのファイルが Prettier のルールに従ってフォーマットされます。

```bash
npm run fmt
```
