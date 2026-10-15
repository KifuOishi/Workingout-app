# Workingout App

React + TypeScript + Vite のアプリです。

## 開発を始める

```powershell
npm.cmd install
npm.cmd run dev
```

表示されたローカルURLをブラウザで開いてください。
PowerShellの実行ポリシーで npm が制限される環境では、npm.cmd を使用します。

## コマンド

- `npm.cmd run dev`: 開発サーバーを起動
- `npm.cmd run build`: 型チェックと本番ビルド（dist に出力）
- `npm.cmd run lint`: コードの静的解析
- `npm.cmd run preview`: 本番ビルドをローカルで確認

## 主なファイル

- `src/App.tsx`: メイン画面
- `src/App.css`: メイン画面のスタイル
- `src/index.css`: 全体のスタイル
- `src/main.tsx`: エントリーポイント
- `vite.config.ts`: Vite の設定

## 筋トレ記録の機能

- 日付・種目・重量・回数・セット数・メモを登録
- 種目の候補選択、自由入力、自重トレーニング（0 kg）に対応
- 記録の編集、確認後の削除、日付による絞り込み
- トレーニング日数、今日のセット数・総負荷量を集計
- スマホ向けのレイアウト

記録は同じブラウザ・同じアクセス先の localStorage に保存されます。
別の端末への同期はありません。ブラウザのサイトデータを削除すると記録も削除されます。
