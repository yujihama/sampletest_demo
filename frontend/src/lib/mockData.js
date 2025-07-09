// モックデータ
export const mockThreads = [
  {
    thread_id: "thread_001_abc123",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:33:23Z",
    status: "idle",
    values: {
      procedure: "売上請求書と出荷データの内容一致確認",
      sample_data_path: "/uploads/sales_data_jan.xlsx",
      result: [
        { invoiceNumber: "INV-2024-001", shipDate: "2024-01-15", match: "✅" },
        { invoiceNumber: "INV-2024-002", shipDate: "2024-01-18", match: "❌" },
        { invoiceNumber: "INV-2024-003", shipDate: "2024-01-20", match: "✅" },
      ]
    }
  },
  {
    thread_id: "thread_002_def456",
    created_at: "2024-01-14T14:20:00Z",
    updated_at: "2024-01-14T14:21:45Z",
    status: "error",
    values: {
      procedure: "在庫データと実地棚卸結果の照合",
      sample_data_path: "/uploads/inventory_data.csv"
    }
  },
  {
    thread_id: "thread_003_ghi789",
    created_at: "2024-01-13T09:15:00Z", 
    updated_at: "2024-01-13T09:17:25Z",
    status: "idle",
    values: {
      procedure: "支払承認プロセスの妥当性確認",
      sample_data_path: "/uploads/payment_approvals.xlsx",
      result: [
        { approvalId: "APP-001", amount: "¥150,000", status: "承認済み" },
        { approvalId: "APP-002", amount: "¥75,000", status: "承認済み" },
        { approvalId: "APP-003", amount: "¥200,000", status: "要確認" },
      ]
    }
  }
];

export const mockInterruptMessage = "データに不整合が検出されました。請求書INV-2024-002の出荷日が記録されていません。どのように処理しますか？";

export const mockExecutionStates = {
  pending: {
    status: "pending",
    progress: 0,
    message: "実行準備中..."
  },
  running: {
    status: "running", 
    progress: 45,
    message: "データ処理中..."
  },
  interrupted: {
    status: "interrupted",
    progress: 60,
    message: "人的確認待ち"
  },
  completed: {
    status: "idle",
    progress: 100,
    message: "実行完了"
  },
  error: {
    status: "error",
    progress: 30,
    message: "エラーが発生しました"
  }
};

