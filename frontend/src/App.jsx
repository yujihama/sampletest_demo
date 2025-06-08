import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { DataUpload } from './components/DataUpload'
import { ProcedureExecution } from './components/ProcedureExecution'
import { HITLMessage } from './components/HITLMessage'
import { ResultsView } from './components/ResultsView'
import { HistoryList } from './components/HistoryList'
import { useNotifications } from './hooks/useNotifications'
import { ThreadProvider } from './contexts/ThreadContext'
import { api, API_BASE_URL } from './lib/api'
import './App.css'

// メインアプリケーションコンポーネント（ThreadContext内部）
function AppContent() {
  // State management
  const [currentThread, setCurrentThread] = useState(null)
  const [executionState, setExecutionState] = useState({
    status: 'idle',
    progress: 0
  })
  const [procedure, setProcedure] = useState('')
  const [selectedSampleFolder, setSelectedSampleFolder] = useState('')
  const [sampleFolders, setSampleFolders] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [threads, setThreads] = useState([])
  const [showHITL, setShowHITL] = useState(false)
  const [interruptMessage, setInterruptMessage] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState(null)

  const { notifyCompletion, notifyHITL, notifyInfo, notifyError } = useNotifications()

  // Load threads and sample folders on mount
  useEffect(() => {
    loadThreads()
    loadSampleFolders()
  }, [])

  const loadThreads = async () => {
    try {
      const threadList = await api.searchThreads()
      setThreads(threadList)
    } catch (error) {
      console.error('Failed to load threads:', error)
      notifyError('履歴の読み込みに失敗しました')
    }
  }

  const loadSampleFolders = async () => {
    try {
      const folderData = await api.getSampleFolders()
      setSampleFolders(folderData.folders || [])
    } catch (error) {
      console.error('Failed to load sample folders:', error)
      notifyError('サンプルフォルダの読み込みに失敗しました')
    }
  }

  const handleSampleFolderSelect = (folderName) => {
    setSelectedSampleFolder(folderName)
    if (folderName) {
      notifyInfo(`サンプルフォルダ "${folderName}" が選択されました`)
    }
  }

  const handleFolderUpload = async (files) => {
    if (files && files.length > 0) {
      try {
        notifyInfo('フォルダをアップロード中...')
        const folderResult = await api.uploadFolder(files)
        const folderName = files[0].webkitRelativePath.split('/')[0]
        console.log('Folder upload result:', folderResult)
        notifyInfo(`フォルダ "${folderName}" (${files.length}ファイル) がアップロードされました`)
      } catch (error) {
        console.error('Folder upload failed:', error)
        notifyError('フォルダのアップロードに失敗しました')
      }
    }
  }

  const handleTemplateSelect = async (file) => {
    if (file) {
      try {
        notifyInfo('調書フォーマットをアップロード中...')
        const templateResult = await api.uploadTemplate(file)
        setSelectedTemplate(file)
        console.log('Template upload result:', templateResult)
        notifyInfo(`調書フォーマット "${file.name}" がアップロードされました`)
      } catch (error) {
        console.error('Template upload failed:', error)
        notifyError('調書フォーマットのアップロードに失敗しました')
      }
    } else {
      setSelectedTemplate(null)
    }
  }

  const handleProcedureChange = (event) => {
    setProcedure(event.target.value)
  }

  const startAndMonitorExecution = (threadId, runId) => {
    api.monitorExecution(
      threadId,
      runId,
      (progress) => {
        setExecutionState(prev => ({
          ...prev,
          progress: progress.progress || prev.progress,
          status: progress.status || prev.status
        }))
      },
      (receivedInterruptData) => {
        console.log('Received interrupt data in App:', receivedInterruptData);
        const message = receivedInterruptData.message || 'interrupt が発生しました';
        setInterruptMessage(message)
        setShowHITL(true)
        setExecutionState(prev => ({ ...prev, status: 'interrupted' }))
        notifyHITL('問い合わせが発生しました')
      },
      (results) => {
        setResults(results)
        setShowResults(true)
        setExecutionState(prev => ({ ...prev, status: 'idle', progress: 100 }))
        notifyCompletion('実行が完了しました')
        loadThreads() // 履歴を更新
      }
    )
  }

  const handleExecute = async () => {
    if (!procedure.trim()) {
      notifyError('手続き内容を入力してください')
      return
    }

    if (!selectedSampleFolder) {
      notifyError('サンプルフォルダを選択してください')
      return
    }

    console.log('Starting execution...');
    try {
      // テンプレートパスを設定（既にアップロード済み）
      let templatePath = null
      if (selectedTemplate) {
        templatePath = `templates/${selectedTemplate.name}`
      }

      // スレッド作成（メタデータにsample_data_pathとprocedureを設定）
      console.log('Creating thread with params:', { procedure, sample_data_path: selectedSampleFolder, templatePath });
      const thread = await api.createThread(procedure, null, selectedSampleFolder, templatePath)
      console.log('Thread created:', thread);
      setCurrentThread(thread)
      
      // 実行開始（inputにprocedureとsample_data_pathを設定）
      const input = {
        procedure: procedure,
        sample_data_path: selectedSampleFolder
      };
      console.log('Execution input:', input);
      const runResult = await api.startExecution(thread.thread_id, input)
      setExecutionState({
        status: 'running',
        progress: 0
      })
      setShowResults(false)
      setShowHITL(false)
      
      notifyInfo('実行を開始しました')
      
      // 実行監視開始
      startAndMonitorExecution(thread.thread_id, runResult.run_id)
      
    } catch (error) {
      console.error('Execution failed:', error)
      notifyError('実行に失敗しました')
      setExecutionState(prev => ({ ...prev, status: 'idle' }))
    }
  }

  const handleHITLResponse = async (response) => {
    try {
      console.log('Sending HITL response to resume execution:', response);
      const runResult = await api.updateThreadState(currentThread.thread_id, response)
      
      setShowHITL(false)
      setExecutionState(prev => ({ ...prev, status: 'running' }))
      notifyInfo('回答を送信しました。実行を継続します。')
      
      console.log('Resume execution started with run_id:', runResult.run_id);
      
      // 継続監視開始
      startAndMonitorExecution(currentThread.thread_id, runResult.run_id)
      
    } catch (error) {
      console.error('Failed to submit HITL response:', error)
      notifyError('回答の送信に失敗しました')
    }
  }

  const handleThreadSelect = async (thread) => {
    setCurrentThread(thread);

    try {
      let df, output_excel_path;

      if (thread.values && thread.values.df) {
        // スレッドオブジェクトに結果データが既にあれば利用
        df = thread.values.df;
        output_excel_path = thread.values.output_excel_path;
      } else {
        // なければAPIから取得
        const threadState = await api.getThreadState(thread.thread_id);
        df = threadState.values?.df;
        output_excel_path = threadState.values?.output_excel_path;
      }
      
      const resultsData = {
        preview_data: df || [
          { sample_data: 1, result: 'サンプル', reason: 'データなし' },
        ],
        excel_output_path: output_excel_path,
        procedure: thread.metadata?.procedure || '不明な手続き',
        status: thread.status,
        thread_info: {
          created_at: thread.created_at,
          updated_at: thread.updated_at,
          thread_id: thread.thread_id
        }
      };

      setResults(resultsData);
      setShowResults(true);
      notifyInfo(`履歴「${thread.metadata?.procedure || thread.thread_id}」を選択しました`);
      
    } catch (error) {
      console.error('Failed to load thread state:', error);
      notifyError('履歴データの読み込みに失敗しました');
      // エラー時もフォールバックデータを表示
      const fallbackData = {
        preview_data: [
          { sample_data: 1, result: 'エラー', reason: 'データの読み込みに失敗しました' }
        ],
        procedure: thread.metadata?.procedure || '不明な手続き',
        status: 'error',
      };
      setResults(fallbackData);
      setShowResults(true);
    }
  }

  const handleDownloadExcel = async (excelOutputPath) => {
    if (!excelOutputPath) {
      console.error('❌ No excel_output_path provided');
      notifyError('ダウンロード可能なファイルがありません');
      return;
    }

    try {
      notifyInfo('調書ファイルの準備をしています...');
      
      // Convert the absolute local path to a server-accessible URL
      // e.g., C:\\...\\data\\format\\file.xlsx -> /files/format/file.xlsx
      const dataMarker = 'data';
      const dataIndex = excelOutputPath.indexOf(dataMarker);
      
      if (dataIndex === -1) {
          notifyError('無効なファイルパスです。');
          console.error('Path does not contain the "data" directory:', excelOutputPath);
          return;
      }

      // Get the path relative to the 'data' directory and format it for a URL
      const relativePath = excelOutputPath.substring(dataIndex + dataMarker.length)
          .replace(/\\/g, '/'); // Replace backslashes with forward slashes

      // Construct the full download URL
      const downloadUrl = `${API_BASE_URL}/files${relativePath}`;

      // Use a simple anchor tag to trigger the download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = excelOutputPath.split('\\').pop()?.split('/').pop() || 'download.xlsx'; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      notifyCompletion('ダウンロードを開始しました');

    } catch (error) {
      console.error('Download failed:', error);
      notifyError('ダウンロードに失敗しました');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              内部監査サンプルテストツール
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Data Preparation */}
          <div className="space-y-6">
            <DataUpload
              onFolderUpload={handleFolderUpload}
              onTemplateSelect={handleTemplateSelect}
              isExecuting={executionState.status === 'running'}
            />

            <ProcedureExecution
              sampleFolders={sampleFolders}
              selectedSampleFolder={selectedSampleFolder}
              onSampleFolderSelect={handleSampleFolderSelect}
              onProcedureChange={handleProcedureChange}
              onExecute={handleExecute}
              isExecuting={['running', 'pending', 'busy'].includes(executionState.status)}
            />
            
            <HistoryList
              threads={threads}
              onRefresh={loadThreads}
              onThreadSelect={handleThreadSelect}
            />
          </div>

          {/* Right Column - Execution & Results */}
          <div className="space-y-6">
            {showResults && (
              <ResultsView
                result={results?.preview_data || results}
                isVisible={showResults}
                onDownload={() => handleDownloadExcel(results?.excel_output_path)}
              />
            )}
          </div>
        </div>

        {/* Bottom Section - HITL Area */}
        <div className="mt-8">
          <HITLMessage
            interruptMessage={interruptMessage}
            interruptData={null}
            threadId={currentThread?.thread_id}
            onSubmit={handleHITLResponse}
            isVisible={showHITL}
          />
        </div>
      </main>

      {/* Toast Notifications */}
      <Toaster position="top-right" />
    </div>
  )
}

// メインAppコンポーネント（ThreadProviderでラップ）
function App() {
  return (
    <ThreadProvider>
      <AppContent />
    </ThreadProvider>
  );
}

export default App

