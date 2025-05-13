# 技術仕様

## TypeScript 設定

- `tsconfig.json` で strict モードおよび厳格な型チェックオプションを有効化
  - `"strict": true`, `"noImplicitAny": true`, `"noUnusedLocals": true` など
- `"include": ["src"]` により、`src/` 配下のみを型チェック対象とする
- JavaScript ファイルも `"checkJs": true` で型チェック対象
- `"noEmit": true` でビルド時のファイル出力を禁止
- その他、詳細は `tsconfig.json` を参照

## 実装構成

### HomePanel の実装構成（ファイル分割）

HomePanel の実装は以下の3ファイルに分割されています：

- `HomePanel.ts`  
  WebViewパネルの管理・コントローラー（UIイベントの受信、Service/View呼び出し）

- `HomePanelService.ts`  
  ビジネスロジック（メモの保存・一覧取得などの処理。ファイル操作は Storage クラスに委譲）

- `HomePanelView.ts`  
  HTML生成（入力パラメータからWebView用HTMLを組み立てて返す）

この分割により、UI制御・ロジック・ビューの責務を明確化しています。

#### ファイル操作責務の分離

- `services/storage.ts`  
  ファイル・ディレクトリの作成、保存、読み込み、一覧取得などの低レベルなストレージ操作を担当。  
  HomePanelService などから呼び出され、ビジネスロジック層からファイル操作を分離することで責務を明確化している。

## ロギング機構

拡張機能の主要なイベント処理・コマンド実行・activation などでは、`Logger` クラスを用いてログを出力する。  
ログは VSCode の OutputChannel に出力される。  
ログレベルは `info`, `warn`, `error`, `debug`, `trace`, `log` を用途に応じて使い分ける。  
ログ方針の詳細は [docs/development/logging-guidelines.md](../development/logging-guidelines.md) を参照。

- 主要関数の呼び出しは info ログ
- 例外処理は error ログ
- 通常発生しない条件分岐やエラー処理は warn ログ
- 内部関数や純粋関数には原則ログを残さない

### Logger クラス仕様

- VSCode の OutputChannel を利用し、静的メソッドでログ出力を行う
- `initialize(outputChannel: OutputChannel)` で OutputChannel をセット
- `info`, `warn`, `error`, `debug`, `trace`, `log` 各メソッドでレベル別に出力
- テストコードで各ログレベルの出力を検証済み（`extension.test.ts` 参照）
