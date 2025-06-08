import { useState, useEffect, useCallback } from 'react';
import { client, handleLangGraphError } from '../lib/langGraphClient';

// デフォルトの人的応答を作成
const createDefaultHumanResponse = (interrupts, initialValue = '') => {
  if (!interrupts || interrupts.length === 0) {
    return {
      responses: [{ type: "ignore", args: null }],
      defaultSubmitType: undefined,
      hasAccept: false
    };
  }

  const responses = [];
  let defaultSubmitType = undefined;
  let hasAccept = false;

  interrupts.forEach((interrupt) => {
    if (interrupt?.action_request) {
      const action = interrupt.action_request.action;
      
      switch (action) {
        case 'ACCEPT':
          responses.push({ type: "accept", args: interrupt.action_request.args || null });
          hasAccept = true;
          if (!defaultSubmitType) defaultSubmitType = "accept";
          break;
        
        case 'REJECT':
          responses.push({ type: "reject", args: interrupt.action_request.args || null });
          if (!defaultSubmitType) defaultSubmitType = "reject";
          break;
          
        case 'EDIT':
          responses.push({ 
            type: "edit", 
            args: { 
              ...interrupt.action_request.args,
              value: initialValue || interrupt.action_request.args?.value || ''
            }
          });
          if (!defaultSubmitType) defaultSubmitType = "edit";
          break;
          
        case 'CUSTOM_INPUT':
          responses.push({ 
            type: "custom", 
            args: { 
              input: initialValue || '',
              ...interrupt.action_request.args
            }
          });
          if (!defaultSubmitType) defaultSubmitType = "custom";
          break;
          
        default:
          responses.push({ type: "ignore", args: null });
      }
    } else {
      responses.push({ type: "ignore", args: null });
    }
  });

  return { responses, defaultSubmitType, hasAccept };
};

// useInterruptedActionsフック
export const useInterruptedActions = ({ 
  threadData, 
  setThreadData,
  initialHumanInterruptEditValue = '' 
}) => {
  const [humanResponse, setHumanResponse] = useState([{ type: "ignore", args: null }]);
  const [selectedSubmitType, setSelectedSubmitType] = useState(undefined);
  const [acceptAllowed, setAcceptAllowed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // threadDataの変更時にinterrupt情報を処理
  useEffect(() => {
    try {
      if (
        !threadData ||
        !threadData.interrupts ||
        threadData.interrupts.length === 0
      ) {
        return;
      }

      const { responses, defaultSubmitType, hasAccept } =
        createDefaultHumanResponse(
          threadData.interrupts,
          initialHumanInterruptEditValue
        );
      
      setSelectedSubmitType(defaultSubmitType);
      setHumanResponse(responses);
      setAcceptAllowed(hasAccept);
    } catch (e) {
      console.error("Error formatting and setting human response state", e);
      // フォールバック値を設定
      setHumanResponse([{ type: "ignore", args: null }]);
      setSelectedSubmitType(undefined);
      setAcceptAllowed(false);
      setError('interrupt情報の処理に失敗しました');
    }
  }, [threadData?.interrupts, initialHumanInterruptEditValue]);

  // interrupt応答の送信
  const submitInterruptResponse = useCallback(async (response, customInput = null) => {
    if (!threadData?.thread?.thread_id) {
      setError('スレッドIDが見つかりません');
      return false;
    }

    try {
      setSubmitting(true);
      setError(null);

      let responsePayload = response;
      
      // カスタム入力がある場合は処理
      if (customInput !== null) {
        if (response.type === 'edit' && response.args) {
          responsePayload = {
            ...response,
            args: { ...response.args, value: customInput }
          };
        } else if (response.type === 'custom') {
          responsePayload = {
            ...response,
            args: { ...response.args, input: customInput }
          };
        }
      }

      // LangGraph APIにresume応答を送信（interrupt地点から再開）
      const runResult = await client.threads.runs.create(
        threadData.thread.thread_id,
        {
          assistant_id: "agent", // 設定に応じて調整
          command: {
            resume: [responsePayload] // HumanResponse配列として送信
          },
          metadata: { 
            interrupt_response: true,
            timestamp: new Date().toISOString() 
          }
        }
      );
      
      console.log('Resume command sent via LangGraph client for thread:', threadData.thread.thread_id, 'with response:', responsePayload);

      // スレッドデータを更新
      if (setThreadData) {
        const updatedThreadData = {
          ...threadData,
          status: "running", // interrupt解消後は実行中に戻る
          interrupts: undefined // interruptをクリア
        };
        setThreadData(updatedThreadData);
      }

      return { success: true, runId: runResult.run_id };
    } catch (err) {
      console.error('Failed to submit interrupt response:', err);
      const errorMessage = 'interrupt応答の送信に失敗しました';
      setError(errorMessage);
      handleLangGraphError(err);
      return { success: false, error: errorMessage };
    } finally {
      setSubmitting(false);
    }
  }, [threadData, setThreadData]);

  // 応答タイプに基づく送信
  const handleAccept = useCallback(() => {
    const acceptResponse = humanResponse.find(r => r.type === 'accept');
    if (acceptResponse) {
      return submitInterruptResponse(acceptResponse);
    }
    return Promise.resolve({ success: false, error: 'Accept応答が見つかりません' });
  }, [humanResponse, submitInterruptResponse]);

  const handleReject = useCallback(() => {
    const rejectResponse = humanResponse.find(r => r.type === 'reject');
    if (rejectResponse) {
      return submitInterruptResponse(rejectResponse);
    }
    return Promise.resolve({ success: false, error: 'Reject応答が見つかりません' });
  }, [humanResponse, submitInterruptResponse]);

  const handleEdit = useCallback((editedValue) => {
    const editResponse = humanResponse.find(r => r.type === 'edit');
    if (editResponse) {
      return submitInterruptResponse(editResponse, editedValue);
    }
    return Promise.resolve({ success: false, error: 'Edit応答が見つかりません' });
  }, [humanResponse, submitInterruptResponse]);

  const handleCustomInput = useCallback((customValue) => {
    const customResponse = humanResponse.find(r => r.type === 'custom');
    if (customResponse) {
      return submitInterruptResponse(customResponse, customValue);
    }
    return Promise.resolve({ success: false, error: 'Custom応答が見つかりません' });
  }, [humanResponse, submitInterruptResponse]);

  // 現在のinterrupt情報を取得
  const getCurrentInterrupt = useCallback(() => {
    if (!threadData?.interrupts || threadData.interrupts.length === 0) {
      return null;
    }
    return threadData.interrupts[0]; // 最初のinterruptを返す
  }, [threadData]);

  return {
    // State
    humanResponse,
    selectedSubmitType,
    acceptAllowed,
    submitting,
    error,
    
    // Actions
    submitInterruptResponse,
    handleAccept,
    handleReject,
    handleEdit,
    handleCustomInput,
    getCurrentInterrupt,
    
    // Setters
    setSelectedSubmitType,
    setHumanResponse,
  };
}; 