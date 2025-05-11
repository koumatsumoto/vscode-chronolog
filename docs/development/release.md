# リリースプロセス

## バージョンアップ・タグ付け手順

リリース時には以下コマンドで version を上げてタグ付けします：

```sh
npm version [patch|minor|major] -m "chore(release): publish version %s"
```

v0.0.x 開発時のリリースコマンド

```sh
npm version patch -m "chore(release): publish version %s"
```

## GitHub Actions による CI/CD 自動化

- すべてのコミット・タグ push 時に GitHub Actions で CI（`npm run ci`）を実行する。
  - Linux 環境では GUI 依存のテストのため、`xvfb-run -a npm run ci` として仮想 X サーバー上で実行する（`.github/workflows/cicd.yml` 参照）。
- タグ（`vX.X.X` 形式）push 時、CI が成功した場合のみ自動で `vsce publish` によるリリースを行う。
  - リリースには GitHub Secrets の `VSCE_PAT` が必要。
- ワークフローファイルは `.github/workflows/cicd.yml` に定義。
