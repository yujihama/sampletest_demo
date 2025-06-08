import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Send, Clock, FileText, User } from "lucide-react"
import { useState } from "react"

export function HITLMessage({ 
  interruptMessage, 
  onSubmit, 
  isVisible 
}) {
  const [response, setResponse] = useState("")

  const handleSubmit = () => {
    if (response.trim()) {
      // HumanResponse形式で送信（LangGraph仕様）
      const humanResponse = {
        type: "response",
        args: response.trim()
      };
      console.log('Sending HumanResponse:', humanResponse);
      onSubmit(humanResponse)
      setResponse("")
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border-orange-200 bg-orange-50 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              手続きが中断されました
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="border-orange-300 bg-orange-100">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 font-medium">
              <div className="font-semibold mb-2">問合せ内容:</div>
              <div className="bg-white p-3 rounded border border-orange-200">
                {interruptMessage || "データの不整合が検出されました。どのように処理しますか？"}
              </div>
            </AlertDescription>
          </Alert>

          {/* 回答セクション */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-700" />
              <label className="text-sm font-semibold text-orange-800">
                回答:
              </label>
            </div>
            
            <Textarea 
              placeholder="回答を入力してください"
              className="min-h-24 border-orange-300 focus:border-orange-500 focus:ring-orange-500"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit} 
              disabled={!response.trim()}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              回答送信
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

