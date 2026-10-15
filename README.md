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
