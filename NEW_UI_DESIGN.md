# 新UI設計概要 - 内部監査サンプルテストツール

## 🎯 設計思想

### 実際のAPI機能に基づくシンプル設計
LangGraphの実際のエンドポイント機能のみを使用した、シンプルで直感的なUIを設計する。

### 主要原則
1. **API機能中心設計**: 実際のLangGraph APIのみを使用
2. **シンプルな操作**: 複雑な機能は排除し、必要最小限の操作のみ
3. **リアルタイム監視**: スレッドの状態監視とHITL対応
4. **ワンページ完結**: すべての機能を単一画面で完結

## 👥 ユーザーペルソナ

### 内部監査人
**役割**: サンプルテストの実行・管理
**ニーズ**: 
- 手続きの簡単な入力・実行
- 実行状況のリアルタイム確認
- HITL問い合わせへの回答
- 結果のダウンロード

## 🏗️ UI設計（シンプル・ワンページ）

### レイアウト: ワンページ完結型

#### 監査実行画面
```
┌─────────────────────────────────────────────────────────┐
│ Header: 監査サンプルテストツール | User                   │
├─────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌─────────────────────────────────┐   │
│ │  データ準備    │ │        手続き実行エリア          │   │
│ │                │ │                                │   │
│ │ ファイル選択   │ │  ┌─────────────────────────────┐  │   │
│ │ [参照] [アップ]│ │  │       実行状況              │  │   │
│ │                │ │  │    (リアルタイム更新)        │  │   │
│ │ 手続きテキスト │ │  └─────────────────────────────┘  │   │
│ │ ┌────────────┐ │ │  ┌─────────────────────────────┐  │   │
│ │ │            │ │ │  │                             │  │   │
│ │ │ 自由記述   │ │ │  │      手続き表示エリア        │  │   │
│ │ │            │ │ │  │                             │  │   │
│ │ └────────────┘ │ │  └─────────────────────────────┘  │   │
│ │ [実行開始]     │ │  [結果ダウンロード] [履歴表示]    │   │
│ └────────────────┘ └─────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│              HITL問い合わせ・通知エリア                    │
└─────────────────────────────────────────────────────────┘
```

## 🎨 主要UIコンポーネント（6つに簡素化）

### 1. データ準備コンポーネント
**目的**: ファイルアップロードと手続き入力

**shadcn/ui使用コンポーネント**:
- `Card`, `CardContent`, `CardHeader` (レイアウト)
- `Input` (ファイル選択)
- `Textarea` (手続き入力)
- `Button` (実行ボタン)
- `Label` (ラベル)

**実装例**:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"

export function DataUpload() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          データファイル
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="file">ファイル選択</Label>
          <Input id="file" type="file" accept=".xlsx,.csv" />
        </div>
        <div>
          <Label htmlFor="procedure">手続き内容</Label>
          <Textarea 
            id="procedure"
            placeholder="売上請求書と出荷データの内容一致確認"
            className="min-h-20"
          />
        </div>
        <Button className="w-full">🚀 実行開始</Button>
      </CardContent>
    </Card>
  )
}
```

### 2. 実行監視コンポーネント
**目的**: スレッドの状態監視

**shadcn/ui使用コンポーネント**:
- `Card` (コンテナ)
- `Badge` (ステータス表示)
- `Progress` (進捗バー)
- `Button` (停止ボタン)

**実装例**:
```typescript
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Pause, Play } from "lucide-react"

export function ExecutionMonitor({ threadId, status, progress }: Props) {
  const statusColor = status === "running" ? "default" : "secondary"
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant={statusColor}>
            {status === "running" ? "🟢 実行中" : "⏸️ 停止中"}
          </Badge>
          <Button variant="outline" size="sm">
            {status === "running" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          Thread: {threadId?.slice(0, 8)}...
        </div>
        <Progress value={progress} className="w-full" />
        <div className="text-sm">実行時間: 00:02:15</div>
      </CardContent>
    </Card>
  )
}
```

### 3. HITLメッセージコンポーネント
**目的**: 中断時の問い合わせ対応

**shadcn/ui使用コンポーネント**:
- `Card` (メッセージコンテナ)
- `Alert`, `AlertDescription` (警告表示)
- `Textarea` (回答入力)
- `Button` (送信ボタン)

**実装例**:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Send } from "lucide-react"

export function HITLMessage({ interruptMessage, onSubmit }: Props) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="w-5 h-5" />
          実行が中断されました
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            {interruptMessage || "データの不整合が検出されました。どのように処理しますか？"}
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          <label className="text-sm font-medium">あなたの回答:</label>
          <Textarea 
            placeholder="例外処理として記録に残す"
            className="min-h-20"
          />
        </div>
        <Button onClick={onSubmit} className="w-full">
          <Send className="w-4 h-4 mr-2" />
          回答して継続
        </Button>
      </CardContent>
    </Card>
  )
}
```

### 4. 結果表示コンポーネント
**目的**: 実行結果の表示・ダウンロード

**shadcn/ui使用コンポーネント**:
- `Card` (結果コンテナ)
- `Badge` (完了ステータス)
- `Table` (DataFrame表示)
- `Button` (ダウンロードボタン)

**実装例**:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText } from "lucide-react"

export function ResultsView({ result, executionTime }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-500">
            📊 実行完了
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>処理件数: 156件</div>
          <div>実行時間: {executionTime || "3分23秒"}</div>
        </div>
        
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">処理結果プレビュー</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>請求書番号</TableHead>
                <TableHead>出荷日</TableHead>
                <TableHead>一致</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>INV-2024-001</TableCell>
                <TableCell>2024-01-15</TableCell>
                <TableCell>✅</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>INV-2024-002</TableCell>
                <TableCell>2024-01-18</TableCell>
                <TableCell>❌</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <Button className="w-full">
          <Download className="w-4 h-4 mr-2" />
          調書フォーマット.xlsx をダウンロード
        </Button>
      </CardContent>
    </Card>
  )
}
```

### 5. 履歴コンポーネント
**目的**: 過去実行の簡単な一覧

**shadcn/ui使用コンポーネント**:
- `Card` (履歴コンテナ)
- `Badge` (ステータスバッジ)
- `Button` (更新ボタン)
- `ScrollArea` (スクロール可能エリア)

**実装例**:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RefreshCw, TrendingUp } from "lucide-react"

export function HistoryList({ threads }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            実行履歴
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {threads?.map((thread) => (
              <div key={thread.thread_id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant={thread.status === 'idle' ? 'default' : 'secondary'}>
                    {thread.status === 'idle' ? '✅' : '❌'}
                  </Badge>
                  <span className="text-sm">売上確認</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  3分23秒 01/15
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
```

### 6. 通知コンポーネント
**目的**: 簡単なトースト通知

**shadcn/ui使用コンポーネント**:
- `Toaster` (react-hot-toast統合)
- `toast()` 関数

**実装例**:
```typescript
import { toast } from "react-hot-toast"
import { CheckCircle, AlertCircle, X } from "lucide-react"

// 使用例
export function useNotifications() {
  const notifyCompletion = () => {
    toast.success("実行が完了しました", {
      icon: <CheckCircle className="w-4 h-4" />,
      duration: 4000,
    })
  }
  
  const notifyHITL = () => {
    toast.error("人的確認が必要です", {
      icon: <AlertCircle className="w-4 h-4" />,
      duration: 0, // 手動で閉じるまで表示
    })
  }
  
  return { notifyCompletion, notifyHITL }
}

// App.tsx で使用
import { Toaster } from "react-hot-toast"

export default function App() {
  return (
    <>
      {/* アプリケーション内容 */}
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'border shadow-lg',
          duration: 3000,
        }}
      />
    </>
  )
}
```

## 🚀 技術実装（シンプル化）

### フロントエンド技術スタック（メンテナンス性重視）
```typescript
// Core Framework
React 18 + TypeScript + Next.js 14 (App Router)

// UI Library (現代的で統一されたデザインシステム)
shadcn/ui + Radix UI + Tailwind CSS

// HTTP Client  
fetch API (標準ライブラリ)

// State Management (シンプル)
useState + useEffect (グローバル状態管理は不要)

// File Upload
React Hook Form + input[type="file"] (フォーム検証付き)

// Notifications
react-hot-toast (軽量・人気・メンテナンス良好)

// Icons
Lucide React (shadcn/uiと統一)

// Utilities
class-variance-authority (CVA) - shadcn/uiと連携
```

### 技術選定理由（長期メンテナンス性重視）

#### shadcn/ui選定理由
- ✅ **copy-pasteアプローチ**: 依存関係を最小化、バージョン管理不要
- ✅ **Radix UIベース**: 高品質なアクセシビリティ対応済み
- ✅ **Tailwind CSS統合**: スタイリングの一貫性確保
- ✅ **TypeScript完全対応**: 型安全性の確保
- ✅ **活発なコミュニティ**: 2024年現在最も人気のUIライブラリ
- ✅ **カスタマイズ性**: コンポーネントのソースコードを直接編集可能

#### 軽量技術スタック採用理由
- ✅ **学習コストの低減**: 複雑な状態管理ライブラリ不使用
- ✅ **デバッグの容易性**: シンプルなコード構造
- ✅ **パフォーマンス**: 最小限の依存関係による高速起動
- ✅ **チーム開発**: 新規メンバーのオンボーディング容易

#### メンテナンス性の保証
```typescript
// パッケージの安定性（2024年基準）
dependencies: {
  "react": "^18.0.0",           // LTS版、長期サポート
  "next": "^14.0.0",            // 安定版、頻繁なアップデート
  "typescript": "^5.0.0",       // 成熟した言語
  "tailwindcss": "^3.0.0",      // 業界標準CSS框架
  "@radix-ui/*": "^1.0.0",      // 安定したコンポーネントライブラリ
  "react-hook-form": "^7.0.0",  // フォーム処理の標準
  "react-hot-toast": "^2.0.0",  // 軽量通知ライブラリ
  "lucide-react": "^0.300.0"    // 人気アイコンライブラリ
}

// 開発効率
- コンポーネント追加: npx shadcn@latest add [component]
- 型安全性: TypeScript完全対応
- スタイリング: Tailwind CSS IntelliSense
- デバッグ: React Developer Tools完全対応
```

### ディレクトリ構造（shadcn/ui対応）
```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx           # メインページ（ワンページ）
│   │   ├── layout.tsx         # レイアウト
│   │   └── globals.css        # グローバルスタイル
│   ├── components/
│   │   ├── ui/                # shadcn/uiコンポーネント（自動生成）
│   │   │   ├── button.tsx     # ボタンコンポーネント
│   │   │   ├── card.tsx       # カードコンポーネント
│   │   │   ├── input.tsx      # 入力フィールド
│   │   │   ├── textarea.tsx   # テキストエリア
│   │   │   ├── badge.tsx      # ステータスバッジ
│   │   │   ├── progress.tsx   # プログレスバー
│   │   │   └── toast.tsx      # トースト通知
│   │   ├── DataUpload.tsx     # データ準備コンポーネント
│   │   ├── ExecutionMonitor.tsx # 実行監視コンポーネント
│   │   ├── HITLMessage.tsx    # HITL対応コンポーネント
│   │   ├── ResultsView.tsx    # 結果表示コンポーネント
│   │   ├── HistoryList.tsx    # 履歴表示コンポーネント
│   │   └── Notifications.tsx  # 通知コンポーネント
│   ├── hooks/
│   │   └── use-api.ts         # API関連カスタムフック
│   ├── lib/
│   │   ├── api.ts             # API呼び出し関数
│   │   └── utils.ts           # shadcn/ui utilities（自動生成）
│   └── types/
│       └── index.ts           # 型定義
├── components.json            # shadcn/ui設定ファイル
├── package.json
├── tailwind.config.ts         # Tailwind設定
└── next.config.js             # Next.js設定
```

### 主要API関数（簡素化）
```typescript
// lib/api.ts
export const api = {
  // スレッド作成・実行
  createThread: () => fetch('/threads', { method: 'POST' }),
  
  // スレッド状態取得  
  getThreadState: (threadId: string) => 
    fetch(`/threads/${threadId}/state`),
  
  // HITL回答送信
  updateThreadState: (threadId: string, response: string) =>
    fetch(`/threads/${threadId}/state`, { 
      method: 'PATCH', 
      body: JSON.stringify({ response }) 
    }),
  
  // 履歴取得
  searchThreads: () => fetch('/threads/search'),
  
  // ファイルアップロード（GraphのInputとして使用）
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch('/upload', { method: 'POST', body: formData });
  }
};
```

### 実際のAPI型定義
```typescript
// types/index.ts（実際のAPIレスポンスに基づく）
interface ThreadState {
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

interface ThreadSearchResult {
  thread_id: string;
  created_at: string;
  updated_at: string;
  status: ThreadState['status'];
  values: ThreadState['values'];
}
```

## 📊 実装方針（現実的）

### 段階的開発
```
Week 1: 基盤構築
├── Next.js プロジェクト作成
├── API接続テスト
└── 基本レイアウト作成

Week 2: コア機能
├── ファイルアップロード
├── 手続き実行
└── 状態監視

Week 3: HITL・結果
├── HITL メッセージ機能
├── 結果表示
└── 履歴一覧

Week 4: 仕上げ
├── エラーハンドリング
├── 通知機能
└── UI調整
```

### 削除した過剰機能
- ❌ テンプレート管理システム
- ❌ 詳細な統計・分析機能
- ❌ 権限管理・ユーザー管理
- ❌ チーム共有機能
- ❌ 複雑なファイル管理
- ❌ カスタムエディタ
- ❌ データ暗号化・セキュリティ機能
- ❌ コンプライアンス機能
- ❌ 複雑なダッシュボード
- ❌ アニメーション・チャート機能

---

この簡素化された設計は、実際のLangGraph APIの機能のみを使用し、
シンプルで実装しやすく、保守しやすいUIを提供します。 