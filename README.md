# Agent Inbox LangGraph Example

LangGraph ServerをバックエンドとするAgent Inbox管理ツールです。エージェントのワークフロー管理とHuman-in-the-Loop（HITL）機能を提供します。

## 🏗️ プロジェクト構造

```
agent-inbox-langgraph-example/
├── agent-inbox-main/          # 現在のフロントエンド (Next.js)
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   │   ├── agent-inbox/  # Agent Inbox機能
│   │   │   ├── app-sidebar/  # サイドバー
│   │   │   ├── icons/        # アイコン
│   │   │   └── ui/           # UI コンポーネント
│   │   ├── hooks/            # カスタムフック
│   │   └── lib/              # ユーティリティ
│   ├── pages/api/            # API Routes
│   └── package.json
├── src/agent/                # LangGraph エージェント
├── docs/                     # ドキュメント
├── data/                     # データファイル
├── langgraph.json            # LangGraph設定
├── pyproject.toml            # Python依存関係
└── README.md
```

## 🚀 技術スタック

### バックエンド
- **LangGraph Server**: エージェントワークフローの実行基盤
- **Python**: エージェントロジック実装

### フロントエンド (agent-inbox-main)
- **Next.js 14.2.25**: Reactフレームワーク (App Router)
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **Radix UI**: UIコンポーネント基盤
- **shadcn/ui**: デザインシステム
- **Assistant UI React**: チャット機能
- **LangGraph SDK**: LangGraphとの通信

### 主要依存関係
```json
{
  "@langchain/langgraph-sdk": "^0.0.83",
  "@assistant-ui/react": "^0.5.71",
  "@radix-ui/react-*": "^1.x.x",
  "@tanstack/react-table": "^8.20.5",
  "framer-motion": "^11.11.9"
}
```

## 🎯 主要機能

### 1. Agent Inbox管理
- 複数のLangGraphデプロイメント対応
- ローカル・リモート環境の統合管理
- LangSmith API キー管理
- エージェント設定の追加・編集・削除

### 2. Thread管理
- **スレッド一覧表示**: フィルタリング・ページネーション対応
- **個別スレッド詳細表示**: メッセージ履歴と状態確認
- **ステータス管理**: 
  - `interrupted`: 割り込み状態
  - `idle`: 待機状態
  - `busy`: 実行中
  - `error`: エラー状態
  - `all`: 全て表示

### 3. Human-in-the-Loop機能
- **エージェント割り込み処理**: エージェントからの確認要求
- **ヒューマンレスポンス**: 
  - `accept`: 承認
  - `ignore`: 無視
  - `response`: カスタム応答
  - `edit`: 編集
- **アクション管理**: 柔軟な承認ワークフロー

### 4. ファイル操作
- **フォルダアップロード**: 複数ファイルの一括アップロード
- **ファイルダウンロード**: 生成されたファイルのダウンロード
- **フォルダ一覧**: アップロード済みフォルダの管理

### 5. Graph実行・監視システム
- **グラフ実行**: ワークフローの手動実行とパラメータ設定
- **リアルタイムポーリング**: 3秒間隔での実行状況監視
- **ストリーミング対応**: リアルタイムイベントストリーム処理
- **実行履歴管理**: 過去の実行結果の保存・参照
- **自動状態更新**: pending → running → idle/error/interrupted の監視
- **データフレーム表示**: 実行結果のテーブル形式表示
- **エラーハンドリング**: タイムアウト・エラー状態の適切な処理

## 🔌 APIエンドポイント

### Next.js API Routes (`/api/`)
| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/get_runs_history` | GET | スレッド履歴の取得 |
| `/api/upload-folder` | POST | フォルダのアップロード |
| `/api/list-folders` | GET | フォルダ一覧の取得 |
| `/api/download-file` | GET | ファイルのダウンロード |

### LangGraph SDK Client エンドポイント (client.*)
**ThreadsClient:**
| メソッド | 説明 |
|---------|------|
| `client.threads.search()` | スレッド検索・フィルタリング（metadata, status, values） |
| `client.threads.get()` | 特定スレッドの詳細取得 |
| `client.threads.create()` | 新規スレッド作成 |
| `client.threads.getState()` | スレッド状態・値の取得 |
| `client.threads.updateState()` | スレッド状態の更新（HITL対応） |
| `client.threads.copy()` | スレッドの複製 |
| `client.threads.delete()` | スレッド削除 |
| `client.threads.get_history()` | スレッド履歴取得 |

**RunsClient:**
| メソッド | 説明 |
|---------|------|
| `client.runs.create()` | 新規Run作成・実行開始 |
| `client.runs.create(threadId, graphId, { command: { resume: [response] } })` | **interrupt地点からの再開（HITL処理）** |
| `client.runs.stream()` | ストリーミング実行（リアルタイム） |
| `client.runs.get()` | Run状態・詳細取得 |
| `client.runs.list()` | Run一覧取得 |
| `client.runs.join()` | Run完了待機（最終状態取得） |
| `client.runs.join_stream()` | リアルタイムストリーミング参加 |
| `client.runs.wait()` | Run完了まで待機 |
| `client.runs.cancel()` | Run中止 |
| `client.runs.delete()` | Run削除 |
| `client.runs.create_batch()` | バッチRun作成 |

**AssistantsClient (参照):**
| メソッド | 説明 |
|---------|------|
| `client.assistants.get()` | Assistant情報取得 |
| `client.assistants.search()` | Assistant検索 |
| `client.assistants.get_graph()` | グラフ構造取得 |
| `client.assistants.get_schemas()` | スキーマ取得 |

### HITL (Human-in-the-Loop) 処理フロー
1. **実行開始**: `client.runs.create(threadId, graphId, { input: data })`
2. **interrupt検知**: `thread.status === 'interrupted'`
3. **HumanResponse送信**: `client.runs.create(threadId, graphId, { command: { resume: [humanResponse] } })`
4. **処理継続**: interrupt地点から実行再開

**HumanResponse形式**:
```javascript
{
  type: "response" | "accept" | "ignore" | "edit",
  args: string | null | ActionRequest
}
```

### LangGraph Server RESTエンドポイント (内部実装)
**Threads管理:**
| エンドポイント | メソッド | 説明 |
|-------------|--------|------|
| `/threads/{id}` | GET | スレッド詳細（status, values含む） |
| `/threads` | POST | スレッド作成 |
| `/threads/search` | POST | スレッド検索（metadata, status, values） |
| `/threads/{id}/state` | GET | スレッド状態取得 |
| `/threads/{id}/state` | POST | スレッド状態更新 |
| `/threads/{id}/history` | GET | スレッド履歴 |

**Runs管理:**
| エンドポイント | メソッド | 説明 |
|-------------|--------|------|
| `/threads/{id}/runs` | POST | Run作成・実行 |
| `/threads/{id}/runs/{run_id}` | GET | Run詳細取得 |
| `/threads/{id}/runs/stream` | POST | ストリーミング実行 |
| `/threads/{id}/runs/{run_id}/stream` | GET | ストリーム参加 |
| `/threads/{id}/runs/{run_id}/join` | GET | Run完了待機 |
| `/threads/{id}/runs/wait` | POST | Run待機 |
| `/runs/stream` | POST | ステートレス実行 |
| `/runs/wait` | POST | ステートレス待機 |

**Webhook・Cron機能:**
| エンドポイント | メソッド | 説明 |
|-------------|--------|------|
| `/threads/{id}/runs/crons` | POST | Thread用Cron作成 |
| `/runs/crons` | POST | Cron作成 |
| すべてのRun系 | ALL | `webhook`パラメータ対応（完了通知） |

**ファイル・フォルダ管理 (プロキシ):**
| エンドポイント | 説明 |
|---------------|------|
| `${deploymentUrl}/upload-folder/` | フォルダアップロード |
| `${deploymentUrl}/list-folders/` | フォルダ一覧取得 |

## 🏛️ アーキテクチャ

### コンポーネント構造
```
RootLayout
├── ThreadsProvider (Context)
├── SidebarProvider + AppSidebar
└── AgentInbox (メインコンテナ)
    ├── AgentInboxView (30%幅)
    │   ├── InboxItem (スレッド項目)
    │   ├── ThreadView (詳細表示)
    │   └── Pagination (ページネーション)
    └── GraphExecutionPanel (70%幅)
        ├── Graph実行フォーム
        ├── リアルタイムポーリング
        ├── 実行履歴表示
        ├── データフレーム表示
        └── ファイルアップロード機能
```

### 実行フロー
```
グラフ実行開始
├── Thread作成 (createClient.threads.create)
├── Run開始 (createClient.runs.create)
├── ポーリング開始 (3秒間隔)
│   ├── 状態確認 (threads.get)
│   ├── pending/running → 継続監視
│   └── idle/error/interrupted → 終了処理
├── 最終状態取得 (threads.getState)
├── 実行履歴更新
└── 結果表示 (DataFrame/JSON)
```

### 状態管理
- **Context API**: グローバル状態管理
- **URL Parameters**: ルーティング状態
- **Local Storage**: ユーザー設定
- **React State**: コンポーネント状態

### データフロー
1. **ThreadsContext**: 中央データ管理
2. **LangGraph SDK**: サーバー通信（REST + WebSocket）
3. **Custom Hooks**: ビジネスロジック分離
4. **Type Safety**: TypeScriptによる型安全性
5. **リアルタイム通信**: 
   - REST API: 基本的なCRUD操作
   - ポーリング: 3秒間隔での状態監視
   - ストリーミング: `runs.stream()`でのリアルタイムイベント
6. **状態管理パターン**:
   - グローバル状態: ThreadsContext
   - ローカル状態: コンポーネント内useState
   - URL状態: クエリパラメータ
   - 永続化: LocalStorage

## 🎨 UI/UXデザイン

### 現在のレイアウト
- **左右分割**: 30%(スレッド一覧) + 70%(実行パネル)
- **サイドバー**: Agent Inbox選択
- **レスポンシブ**: 限定的なモバイル対応

### 主要UIコンポーネント
- **Inbox Item**: スレッド表示カード
- **Thread View**: 詳細スレッド表示
- **Settings Popover**: 設定ダイアログ
- **Status Indicators**: ステータス表示
- **Pagination**: ページネーション

## 🔧 カスタムフック

| フック名 | 用途 |
|---------|------|
| `useQueryParams` | URLパラメータ管理 |
| `useScrollPosition` | スクロール位置保存 |
| `useLocalStorage` | ローカルストレージ |
| `useInboxes` | Agent Inbox管理 |
| `useThreadsContext` | スレッドデータ管理 |
| `useInterruptedActions` | HITLアクション・ストリーミング処理 |

## 📊 型定義

### 主要型
```typescript
interface ThreadData<T> {
  thread: Thread<T>;
  status: "idle" | "busy" | "error" | "interrupted";
  interrupts?: HumanInterrupt[];
  invalidSchema?: boolean;
}

interface AgentInbox {
  id: string;
  graphId: string;
  deploymentUrl: string;
  name?: string;
  selected: boolean;
  tenantId?: string;
  createdAt: string;
}

interface HumanInterrupt {
  action_request: ActionRequest;
  config: HumanInterruptConfig;
  description?: string;
}

interface ExecutionHistoryEntry {
  runId: string;
  threadId: string;
  graphId: string;
  input: any;
  output: any;
  status: string;
  timestamp: string;
}

interface HumanResponse {
  type: "accept" | "ignore" | "response" | "edit";
  args: null | string | ActionRequest;
}
```

## 🚀 セットアップ

### 前提条件
- Node.js 18以上
- Python 3.8以上
- Yarn または npm

### フロントエンド起動
```bash
cd agent-inbox-main
yarn install
yarn dev
```

### バックエンド起動
```bash
# Python環境のセットアップ
pip install -r requirements.txt

# LangGraph Server起動
langgraph serve
```

## ⚙️ 技術的詳細

### グラフ実行システム
1. **実行トリガー**: GraphExecutionPanelからの手動実行
2. **ポーリングメカニズム**: 
   - 間隔: 3秒
   - 最大試行: 100回（5分間）
   - 監視対象: `pending`, `running` ステータス
3. **ストリーミング機能**:
   - `client.runs.stream()` による結果をイベントストリーム
   - リアルタイムUI更新
   - Human-in-the-Loop処理での応答送信

### パフォーマンス最適化
- **差分更新**: React.memo, useMemo, useCallback活用
- **仮想化**: 大量データのレンダリング最適化
- **遅延読み込み**: コンポーネントの動的インポート
- **バンドル分割**: ページ単位でのコード分割

## 📋 開発計画

### 新しいフロントエンド設計方針
1. **現在の機能維持**: 既存機能の完全な互換性
2. **モダンUI/UX**: より直感的なデザイン
3. **レスポンシブ対応**: モバイル・タブレット対応強化
4. **パフォーマンス最適化**: 読み込み速度とレスポンス改善
5. **アクセシビリティ**: WCAG準拠

### 技術的改善点
- **状態管理**: Redux ToolkitまたはZustand検討
- **リアルタイム通信**: WebSocket対応強化
- **キャッシュ戦略**: React QueryまたはSWR導入
- **テスト**: Jestとユニットテスト追加
- **監視**: エラートラッキングとパフォーマンス監視

## 📝 ライセンス

このプロジェクトは開発中のサンプルプロジェクトです。

## 🤝 コントリビューション

1. 現在の`agent-inbox-main`は保持
2. 新しいフロントエンドは別ディレクトリに構築
3. 既存機能との互換性を維持
4. 段階的なマイグレーション計画

---

**注意**: このツールは開発中のため、プロダクション環境での使用前に十分なテストを実施してください。 