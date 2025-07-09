// LangGraph Client設定
import { Client } from "@langchain/langgraph-sdk";

// 環境設定
const LANGGRAPH_API_URL = import.meta.env.VITE_LANGGRAPH_API_URL || 'http://127.0.0.1:2024';

// LangGraph Clientインスタンス
export const client = new Client({
  apiUrl: LANGGRAPH_API_URL,
});

// デバッグ用
console.log('LangGraph Client initialized with URL:', LANGGRAPH_API_URL);

// LangGraph固有のエラーハンドリング
export const handleLangGraphError = (error) => {
  console.error('LangGraph API Error:', error);
  
  if (error.response) {
    // HTTPエラーレスポンス
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 404:
        throw new Error('スレッドまたはリソースが見つかりません');
      case 429:
        throw new Error('リクエストが多すぎます。しばらく待ってから再試行してください');
      case 500:
        throw new Error('サーバーエラーが発生しました');
      default:
        throw new Error(`API error: ${status} ${data?.message || 'Unknown error'}`);
    }
  } else if (error.request) {
    // ネットワークエラー
    throw new Error('ネットワークエラー: サーバーに接続できません');
  } else {
    // その他のエラー
    throw new Error(error.message || 'Unknown error occurred');
  }
}; 