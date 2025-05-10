# UI 開発ガイドライン

## テーマ対応

- HomeパネルのWebviewは、VSCodeのテーマ（ダーク/ライト）に自動追従した配色とすること。
- CSSカスタムプロパティ（--vscode-editor-background, --vscode-panel-background, --vscode-editor-foreground など）を利用してカラーリングを行うこと。
- 静的な色指定（#fff など）は使用しないこと。

## 開発ポリシー

- テストのためにUI実装（特にstyleやCSS構造）を変更してはならない。
- UIのstyleや見た目に関するアサーションを vscode-test に追加しない。
- UI仕様は必ず仕様書・設計方針に従い、テスト駆動でUIを作り込まないこと。
