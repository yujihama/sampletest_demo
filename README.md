# Agent Inbox LangGraph Example

LangGraph + FastAPIサーバーとReactフロントエンドによるエージェントワークフロー管理ツールです。  
人的介入（HITL）を含む業務プロセスの自動化・監視・ファイル管理をサポートします。

---

## 🏗️ プロジェクト構造

```
agent-inbox-langgraph-example/
├── frontend/                # フロントエンド（React+Vite）
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── ...
├── src/                     # バックエンド（FastAPI+LangGraph）
│   ├── webapp.py
│   ├── graph.py
│   ├── state.py
│   └── ...
├── data/                    # データ・アップロード先
├── docs/                    # ドキュメント
├── pyproject.toml           # Python依存関係
└── README.md
```

---

## 🚀 技術スタック

### バックエンド
- **Python 3.13+**
- **FastAPI**: APIサーバー
- **LangGraph**: エージェントワークフロー
- **pandas, openpyxl**: データ処理

### フロントエンド
- **React 19**
- **Vite**
- **TypeScript/JavaScript**
- **Tailwind CSS**
- **shadcn/ui, Radix UI, Lucide React**: UIコンポーネント
- **React Router, React Hook Form, Zod, Sonner**

---

## 🎯 主要機能

- スレッド（業務単位）作成・実行・履歴管理
- サンプルデータ/テンプレートのアップロード・管理
- 実行進捗のリアルタイム監視（ポーリング）
- 人的介入（HITL）フロー
- 実行結果のダウンロード
- UI通知・履歴表示

---

## 🔌 APIエンドポイント

### バックエンド（FastAPI）

| エンドポイント           | メソッド | 説明                       |
|-------------------------|----------|----------------------------|
| `/upload-folder/`       | POST     | サンプルデータフォルダのアップロード |
| `/upload-format/`       | POST     | テンプレートファイルのアップロード   |
| `/list-folders/`        | GET      | サンプルフォルダ一覧の取得         |
| `/files/...`            | GET      | アップロード済みファイルの配信      |

### スレッド・実行管理（LangGraph API）

| エンドポイント                   | メソッド | 説明                       |
|-----------------------------------|----------|----------------------------|
| `/threads`                       | POST     | スレッド作成               |
| `/threads/search`                | POST     | スレッド検索               |
| `/threads/{thread_id}`           | GET      | スレッド詳細取得           |
| `/threads/{thread_id}/state`     | GET      | スレッド状態取得           |
| `/threads/{thread_id}/runs`      | POST     | 実行開始・HITL応答         |

---

## 📊 型定義（抜粋）

```typescript
export interface ThreadState {
  thread_id: string;
  status: "pending" | "running" | "idle" | "interrupted" | "error";
  values: {
    procedure: string;
    sample_data_path?: string;
    df?: any[];
    output_excel_path?: string;
    result?: any[];
  };
  interrupts?: {
    [interrupt_id: string]: any;
  };
}

export interface FileUploadResponse {
  file_path: string;
  file_name: string;
  file_size: number;
}
```

---

## 🏛️ アーキテクチャ・UI構成

- **App.jsx**: ルートコンポーネント。全体状態管理・API連携・主要UI制御。
- **components/**:  
  - DataUpload: ファイル/フォルダアップロード
  - ProcedureExecution: 実行フォーム・進捗
  - HITLMessage: 人的介入ダイアログ
  - ResultsView: 実行結果表示
  - HistoryList: 履歴リスト
- **hooks/**: useNotifications等
- **contexts/**: ThreadContext（スレッド状態のグローバル管理）

### データフロー
1. 起動時にスレッド・サンプルフォルダ一覧を取得
2. ユーザー操作でアップロード・実行
3. 実行中はポーリングで進捗監視
4. interrupt時はHITLダイアログ表示→応答で再開
5. 完了時に結果表示・履歴更新

---

## 🚀 セットアップ

### 前提条件
- Node.js 18+
- Python 3.8+
- Yarn または npm
- Poetry

### フロントエンド起動
```powershell
cd frontend
yarn install
yarn dev
```

### バックエンド起動
```powershell
poetry install
poetry run uvicorn webapp:app --reload
```

---

## 注意点・改善提案

- 構成やAPI仕様が変わった場合はREADMEも必ず更新してください。
- UI/UXやAPI設計の改善提案は随時歓迎します。

---

**本READMEは2024年6月時点の実装に基づき最新化されています。**