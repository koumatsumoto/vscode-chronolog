## UIテスト・実装方針に関する重要ルール（2025/05/10追記）

- テストのためにUI実装（特にstyleやCSS構造）を変更してはならない。
- UIのstyleや見た目に関するアサーションを vscode-test に追加しない。
- UI仕様は必ず仕様書・設計方針に従い、テスト駆動でUIを作り込まないこと。
- 本ルールは今後の全ての開発で厳守し、必ずこのドキュメントを参照すること。

---

## リリース時のバージョンアップ・タグ付け手順

リリース時には以下コマンドでversionを上げてタグ付けすること

```sh
npm version [patch|minor|major] -m "chore(release): publish version %s"
```

---

## GitHub ActionsによるCI/CD自動化

- すべてのコミット・タグpush時にGitHub ActionsでCI（`npm run ci`）を実行する。
  - Linux環境ではGUI依存のテストのため、`xvfb-run -a npm run ci` として仮想Xサーバー上で実行する（`.github/workflows/cicd.yml`参照）。
- タグ（`vX.X.X`形式）push時、CIが成功した場合のみ自動で `vsce publish` によるリリースを行う。
  - リリースにはGitHub Secretsの `VSCE_PAT` が必要。
- ワークフローファイルは `.github/workflows/cicd.yml` に定義。
