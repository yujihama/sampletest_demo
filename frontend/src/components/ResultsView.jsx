import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileText } from "lucide-react"

export function ResultsView({ result, onDownload, isVisible }) {
  if (!isVisible) return null

  const sampleData = [
    { sample_data: 1, result: "OK", reason: "サンプル検証：正常" },
    { sample_data: 2, result: "NG", reason: "サンプル検証：要確認" },
    { sample_data: 3, result: "OK", reason: "サンプル検証：正常" },
  ]

  // resultが配列でない場合の安全な処理
  const getDisplayData = () => {
    if (Array.isArray(result)) {
      return result
    }
    if (result && typeof result === 'object') {
      // resultがオブジェクトの場合、適切な配列プロパティを探す（dfを最優先）
      if (Array.isArray(result.df)) {
        return result.df
      }
      if (Array.isArray(result.preview_data)) {
        return result.preview_data
      }
      if (Array.isArray(result.data)) {
        return result.data
      }
      if (Array.isArray(result.results)) {
        return result.results
      }
      if (Array.isArray(result.items)) {
        return result.items
      }
      
      // オブジェクト自体を配列形式に変換を試みる
      const entries = Object.entries(result)
      if (entries.length > 0) {
        const converted = entries.map(([key, value]) => ({
          sample_data: key,
          result: typeof value === 'object' ? JSON.stringify(value) : String(value),
          reason: "根拠"
        }));
        return converted
      }
    }
    // フォールバック：サンプルデータを使用
    return sampleData
  }

  const displayData = getDisplayData()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="default" className="bg-green-600 text-lg px-4 py-0">
            実行完了
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">手続き結果</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>サンプルデータ</TableHead>
                <TableHead>結果</TableHead>
                <TableHead>根拠</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {row.sample_data || row.sampleData || `項目-${index + 1}`}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.result === 'OK' ? 'default' : row.result === 'NG' ? 'destructive' : 'secondary'}
                      className={row.result === 'OK' ? 'bg-green-600 text-white' : ''}
                    >
                      {row.result || '--'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.reason || row.description || row.note || '--'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <Button 
          className="w-full" 
          onClick={() => {
            onDownload && onDownload();
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          更新された調書のダウンロード
        </Button>

      </CardContent>
    </Card>
  )
}

