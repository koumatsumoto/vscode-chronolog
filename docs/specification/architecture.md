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

#### WebViewメッセージハンドリングのエラーハンドリング仕様

- `HomePanel.ts` の `onDidReceiveMessage` コールバックは `async` 関数として実装し、Promiseチェーンのcatch漏れによる未処理rejectionを防ぐ。
- すべての非同期処理は `try/catch` でラップし、エラー発生時は `vscode.window.showErrorMessage` でユーザーに通知する。
- これにより、拡張ホストでの「rejected promise not handled within 1 second」エラーを防止する。

HomePanel の実装は以下の3ファイルに分割されています：

- `panels/HomePanel.ts`  
  WebViewパネルの管理・コントローラー（UIイベントの受信、Service/View呼び出し）

- `panels/HomePanelService.ts`  
  ビジネスロジック（メモの保存・一覧取得などの処理。ファイル操作は Storage クラスに委譲）

- `panels/HomePanelView.ts`  
  HTML生成（入力パラメータからWebView用HTMLを組み立てて返す）

この分割により、UI制御・ロジック・ビューの責務を明確化しています。

#### ファイル操作責務の分離

- `services/storage.ts`  
  DataStorage クラスが、ファイル・ディレクトリの作成、保存、読み込み、一覧取得などの低レベルなストレージ操作を担当する。  
  利用側はフォルダ名やファイル構造を意識せず、メモ一覧取得やメモ保存などのデータ操作を行うことができる。
  具体的には「最新10件のメモファイル一覧(string[])を取得」「メモを保存」などのAPIを提供し、データの物理配置やファイル操作の詳細はこのクラスが隠蔽する。
  また、ワークスペース初期化時に `.clog` および `.clog/memo` ディレクトリを作成する `initializeWorkspaceDirs(rootPath, logger)` メソッドも提供する。

#### DataStorage クラスの主なAPI

- `initializeWorkspaceDirs(rootPath, logger)`  
  .clog/.clog/memoディレクトリの初期化

- `saveMemo(rootPath, fileName, content)`  
  メモファイルの保存

- `readMemo(rootPath, fileName)`  
  メモファイルの内容取得

- `listLatestMemoFiles(rootPath, limit=10)`  
  最新のメモファイル名リスト取得（新しい順）

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
