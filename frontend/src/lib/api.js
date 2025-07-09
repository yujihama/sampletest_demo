// API設定
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || false;
export const API_BASE_URL = USE_MOCK_API ? '/mock-api' : 'http://localhost:2024';
const LANGGRAPH_API_URL = import.meta.env.VITE_LANGGRAPH_API_URL || 'http://localhost:2024';

console.log('API Mode:', USE_MOCK_API ? 'MOCK' : 'REAL', 'Base URL:', API_BASE_URL);

// モックデータ（フォールバック用）
const mockThreads = [
  {
    thread_id: "thread_1704067200_mock1",
    status: "idle",
    values: {
      procedure: "売上データと出荷データの突合確認",
      sample_data_path: "/uploads/sales_data.xlsx",
      result: [
        { invoiceNumber: "INV-2024-001", shipDate: "2024-01-15", match: "✅" },
        { invoiceNumber: "INV-2024-002", shipDate: "2024-01-18", match: "❌" }
      ]
    },
    updated_at: "2024-01-01T12:00:00Z"
  }
];

// ユーティリティ関数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// HTTP リクエストヘルパー
const makeRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ API Error for ${url}:`, error);
    throw error;
  }
};

// モック実装
const mockApi = {
  createThread: async (procedure, filePath, folderPath, templatePath) => {
    await delay(1000);
    const threadId = `mock_thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newThread = {
      thread_id: threadId,
      status: "pending",
      values: { procedure, sample_data_path: filePath, folder_path: folderPath, template_path: templatePath }
    };
    
    const existingThreads = JSON.parse(localStorage.getItem('audit_threads') || '[]');
    existingThreads.unshift(newThread);
    localStorage.setItem('audit_threads', JSON.stringify(existingThreads));
    
    return newThread;
  },
  
  startExecution: async (threadId, input = {}) => {
    await delay(800);
    console.log('Mock startExecution input:', input);
    const threads = JSON.parse(localStorage.getItem('audit_threads') || '[]');
    const threadIndex = threads.findIndex(t => t.thread_id === threadId);
    
    if (threadIndex !== -1) {
    threads[threadIndex].status = "running";
    localStorage.setItem('audit_threads', JSON.stringify(threads));
    }
    
    return { thread_id: threadId, run_id: `run_${Date.now()}`, status: "running" };
  },

  uploadFile: async (file) => {
    await delay(2000);
    return { file_path: `/uploads/${file.name}`, file_name: file.name, file_size: file.size };
  },

  uploadFolder: async (files) => {
    await delay(3000);
    const folderName = files[0].webkitRelativePath.split('/')[0];
    return { folder_path: `/uploads/folders/${folderName}`, folder_name: folderName, file_count: files.length };
  },

  uploadTemplate: async (file) => {
    await delay(1500);
    return { template_path: `/uploads/templates/${file.name}`, template_name: file.name };
  },

  searchThreads: async () => {
    await delay(600);
    const localThreads = JSON.parse(localStorage.getItem('audit_threads') || '[]');
    return localThreads.length > 0 ? localThreads : mockThreads;
  },

  monitorExecution: async (threadId, runId, onProgress, onInterrupt, onComplete) => {
    const steps = [
      { progress: 10, message: "ファイル読み込み中..." },
      { progress: 25, message: "データ検証中..." },
      { progress: 40, message: "手続き実行中..." },
      { progress: 60, message: "結果分析中..." },
      { progress: 80, message: "レポート生成中..." },
      { progress: 100, message: "完了" }
    ];
    
    for (let i = 0; i < steps.length; i++) {
      await delay(2000);
      onProgress({ progress: steps[i].progress, status: 'running', message: steps[i].message });
      
      if (steps[i].progress === 60 && Math.random() > 0.7) {
        onInterrupt({
          message: "データの一致性に疑問があります。手動確認をお願いします。",
          data: { question: "このデータは正しいですか？", options: ["はい", "いいえ"] }
        });
        return;
      }
    }
    
    const result = [
      { invoiceNumber: "INV-2024-001", shipDate: "2024-01-15", match: "✅" },
      { invoiceNumber: "INV-2024-002", shipDate: "2024-01-18", match: "❌" }
    ];
    
    onComplete(result);
  },

  updateThreadState: async (threadId, response) => { // eslint-disable-line no-unused-vars
    await delay(1000);
    return { thread_id: threadId, run_id: `run_${Date.now()}`, status: "running" };
  },

  getSampleFolders: async () => {
    await delay(500);
    return { 
      folders: ["sample_data_001", "sample_data_002", "monthly_reports", "audit_test_data"] 
    };
  },

  downloadExcel: async (filePath) => {
    await delay(1500);
    console.log('Mock download for file:', filePath);
    // モックExcelファイルを生成
    const csvContent = "サンプルデータ,結果,理由\n1,OK,サンプル検証：正常\n2,NG,サンプル検証：要確認";
    return new Blob([csvContent], { type: 'text/csv' });
  }
};

// 実際のAPI実装
const realApi = {
  createThread: async (procedure, filePath, folderPath, templatePath) => {
    const requestBody = {
      metadata: {
        procedure, sample_data_path: filePath, folder_path: folderPath, template_path: templatePath,
        created_at: new Date().toISOString()
      }
    };
    
    const threadData = await makeRequest(`${API_BASE_URL}/threads`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    return {
      thread_id: threadData.thread_id,
      status: threadData.status || "pending",
      values: { procedure, sample_data_path: filePath, folder_path: folderPath, template_path: templatePath }
    };
  },
  
  getThreadState: async (threadId) => {
    return await makeRequest(`${API_BASE_URL}/threads/${threadId}/state`);
  },
  
  startExecution: async (threadId, input = {}) => {
    const runData = await makeRequest(`${API_BASE_URL}/threads/${threadId}/runs`, {
      method: 'POST',
      body: JSON.stringify({
        assistant_id: "agent",
        input: input,
        metadata: { started_at: new Date().toISOString() }
      })
    });

    return { thread_id: threadId, run_id: runData.run_id, status: runData.status || "running" };
  },
  
  updateThreadState: async (threadId, response) => {
    // LangGraph SDK方式でresume処理を実行
    const runData = await makeRequest(`${API_BASE_URL}/threads/${threadId}/runs`, {
      method: 'POST',
      body: JSON.stringify({
        assistant_id: "agent",
        command: {
          resume: [response] // HumanResponse配列として送信（interrupt地点から再開）
        },
        metadata: { 
          updated_at: new Date().toISOString(),
          interrupt_response: true 
        }
      })
    });

    return { thread_id: threadId, run_id: runData.run_id, status: runData.status || "running" };
  },

  getSampleFolders: async () => {
    return await makeRequest(`${API_BASE_URL}/list-folders/`);
  },

  downloadExcel: async (filePath) => {
    const response = await fetch(`${API_BASE_URL}/download-excel/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file_path: filePath })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  },
  
  searchThreads: async () => {
    const threadsData = await makeRequest(`${API_BASE_URL}/threads/search`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    // LangGraph APIは配列を直接返すため、threadsData自体が配列
    return Array.isArray(threadsData) ? threadsData : [];
  },
  
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('files', file);

    const response = await fetch(`${API_BASE_URL}/upload-folder/`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      file_path: result.files[0]?.saved_path || `/uploads/${file.name}`,
      file_name: file.name,
      file_size: file.size
    };
  },

  uploadFolder: async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await fetch(`${API_BASE_URL}/upload-folder/`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const folderName = files[0].webkitRelativePath.split('/')[0];
    
    return {
      folder_path: `/uploads/folders/${folderName}`,
      folder_name: folderName,
      file_count: files.length,
      files: result.files || []
    };
  },

  uploadTemplate: async (file) => {
    const formData = new FormData();
    formData.append('files', file);

    const response = await fetch(`${API_BASE_URL}/upload-format/`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      template_path: result.files[0]?.saved_path || `/uploads/templates/${file.name}`,
      template_name: file.name,
      template_size: file.size
    };
  },
  
  monitorExecution: async (threadId, runId, onProgress, onInterrupt, onComplete) => {
    let isCompleted = false;
    const pollInterval = 2000;
    const maxAttempts = 100; // タイムアウト防止
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        if (attempts > maxAttempts) {
          console.error('Monitoring timeout reached');
          return;
        }

        // スレッド情報を取得（統一されたAPIエンドポイントを使用）
        const thread = await makeRequest(`${API_BASE_URL}/threads/${threadId}`);
        
        console.log(`🔄 Poll attempt ${attempts}: Thread status = ${thread.status}`);
        
        onProgress({
          status: thread.status || 'running',
          metadata: thread.metadata,
          message: thread.status === 'running' ? 'タスク実行中...' : thread.status
        });

        // interrupt状態の詳細チェック
        if (thread.status === 'interrupted') {
          console.log('🚨 INTERRUPT detected! Calling onInterrupt...');
          console.log('🔍 Thread status:', thread.status, 'Thread data:', thread);
          
          // agent-inbox-main方式でinterrupt詳細を抽出
          let extractedMessage = "実行が中断されました。ユーザーの入力をお待ちしています。";
          let extractedInterrupts = [];
          
          if (thread.interrupts && Object.values(thread.interrupts).length > 0) {
            const interruptValues = Object.values(thread.interrupts);
            console.log('🔍 Raw interrupt values:', interruptValues);
            
            extractedInterrupts = interruptValues.flatMap((interrupt) => {
              try {
                if (Array.isArray(interrupt) && interrupt.length > 0) {
                  // Case 1: Array with nested structure [0].value
                  if (interrupt[0]?.value && Array.isArray(interrupt[0].value)) {
                    return interrupt[0].value;
                  }
                  // Case 2: Array with direct structure
                  else if (Array.isArray(interrupt[0])) {
                    return interrupt[0];
                  }
                }
                return [];
              } catch (error) {
                console.error('Error processing interrupt:', error);
                return [];
              }
            });
            
            // メッセージを抽出
            if (extractedInterrupts.length > 0) {
              const firstInterrupt = extractedInterrupts[0];
              if (firstInterrupt?.action_request?.args?.message) {
                extractedMessage = firstInterrupt.action_request.args.message;
              } else if (firstInterrupt?.action_request?.message) {
                extractedMessage = firstInterrupt.action_request.message;
              }
            }
          }
          
          const interruptData = {
            message: extractedMessage,
            interrupts: extractedInterrupts,
            thread: thread
          };
          
          console.log('🔍 Processed interrupt data:', interruptData);
          console.log('🔍 Extracted message:', extractedMessage);
          onInterrupt(interruptData);
          return;
        }

        if (thread.status === 'idle' || thread.status === 'success') {
          console.log('✅ Execution completed! Thread status:', thread.status);
          try {
            const threadState = await makeRequest(`${API_BASE_URL}/threads/${threadId}/state`);
            console.log('📊 Final thread state:', threadState.values);
            onComplete(threadState.values || {});
          } catch (stateError) {
            console.warn('Failed to get thread state, using thread data:', stateError);
            onComplete(thread.values || {});
          }
          isCompleted = true;
          return;
        }

        if (thread.status === 'error') {
          throw new Error(thread.error || 'Execution failed');
        }

        if (!isCompleted && (thread.status === 'running' || thread.status === 'pending' || thread.status === 'busy')) {
          setTimeout(poll, pollInterval);
        }
      } catch (error) {
        console.error('Monitoring error:', error);
        
        // 3回目以降のエラーでモックAPIにフォールバック
        if (attempts >= 3) {
          console.log('Falling back to mock API after multiple errors...');
          await mockApi.monitorExecution(threadId, runId, onProgress, onInterrupt, onComplete);
        } else {
          // リトライ
          setTimeout(poll, pollInterval);
        }
      }
    };

    poll();
  }
};

// APIオブジェクトをエクスポート（フォールバック機能付き）
export const api = {
  ...realApi,
  
  // 各メソッドでエラー時にモックAPIにフォールバック
  createThread: async (...args) => {
    console.log('🔄 API createThread called with:', args);
    console.log('🔧 USE_MOCK_API:', USE_MOCK_API);
    
    if (USE_MOCK_API) {
      console.log('🎭 Using mock API');
      return mockApi.createThread(...args);
    }
    
    try {
      console.log('🌐 Trying real API...');
      const result = await realApi.createThread(...args);
      console.log('✅ Real API success:', result);
      return result;
    } catch (error) {
      console.warn('❌ Real API failed, falling back to mock:', error);
      console.log('🎭 Falling back to mock API');
      return await mockApi.createThread(...args);
    }
  },

  startExecution: async (...args) => {
    if (USE_MOCK_API) return mockApi.startExecution(...args);
    try {
      return await realApi.startExecution(...args);
    } catch (error) {
      console.warn('Real API failed, falling back to mock:', error);
      return await mockApi.startExecution(...args);
    }
  },

  uploadFile: async (...args) => {
    if (USE_MOCK_API) return mockApi.uploadFile(...args);
    try {
      return await realApi.uploadFile(...args);
    } catch (error) {
      console.warn('Real API failed, falling back to mock:', error);
      return await mockApi.uploadFile(...args);
    }
  },

  uploadFolder: async (...args) => {
    if (USE_MOCK_API) return mockApi.uploadFolder(...args);
    try {
      return await realApi.uploadFolder(...args);
    } catch (error) {
      console.warn('Real API failed, falling back to mock:', error);
      return await mockApi.uploadFolder(...args);
    }
  },

  uploadTemplate: async (...args) => {
    if (USE_MOCK_API) return mockApi.uploadTemplate(...args);
    try {
      return await realApi.uploadTemplate(...args);
    } catch (error) {
      console.warn('Real API failed, falling back to mock:', error);
      return await mockApi.uploadTemplate(...args);
    }
  },

  searchThreads: async (...args) => {
    if (USE_MOCK_API) return mockApi.searchThreads(...args);
    try {
      return await realApi.searchThreads(...args);
    } catch (error) {
      console.warn('Real API failed, falling back to mock:', error);
      return await mockApi.searchThreads(...args);
    }
  },

  updateThreadState: async (...args) => {
    if (USE_MOCK_API) return mockApi.updateThreadState(...args);
    try {
      return await realApi.updateThreadState(...args);
    } catch (error) {
      console.warn('Real API failed, falling back to mock:', error);
      return await mockApi.updateThreadState(...args);
    }
  },

  monitorExecution: async (...args) => {
    if (USE_MOCK_API) return mockApi.monitorExecution(...args);
    try {
      return await realApi.monitorExecution(...args);
    } catch (error) {
      console.warn('Real API failed, falling back to mock:', error);
      return await mockApi.monitorExecution(...args);
    }
  },

  getThreadState: async (...args) => {
    if (USE_MOCK_API) return { status: 'idle' };
    try {
      return await realApi.getThreadState(...args);
    } catch (error) {
      console.warn('Real API failed, falling back to mock:', error);
      return { status: 'idle' };
    }
  },

  getSampleFolders: async (...args) => {
    if (USE_MOCK_API) return mockApi.getSampleFolders(...args);
    try {
      return await realApi.getSampleFolders(...args);
    } catch (error) {
      console.warn('Real API failed, falling back to mock:', error);
      return await mockApi.getSampleFolders(...args);
    }
  },

  downloadExcel: async (...args) => {
    if (USE_MOCK_API) return mockApi.downloadExcel(...args);
    try {
      return await realApi.downloadExcel(...args);
    } catch (error) {
      console.warn('Real API failed, falling back to mock:', error);
      return await mockApi.downloadExcel(...args);
    }
  }
};

