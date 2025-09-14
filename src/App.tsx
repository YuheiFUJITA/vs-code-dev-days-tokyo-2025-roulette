import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Play, Upload, Trophy, Users } from "@phosphor-icons/react"
import { toast } from 'sonner'

interface Participant {
  participantFrame: string
  username: string
  displayName: string
  participationStatus: string
  attendanceStatus: string
  [key: string]: string
}

function App() {
  const [csvText, setCsvText] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [eligibleParticipants, setEligibleParticipants] = useState<Participant[]>([])
  const [winners, setWinners, deleteWinners] = useKV<Participant[]>('lottery-winners', [])
  const [isProcessing, setIsProcessing] = useState(false)

  const parseCSV = (text: string): Participant[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const expectedHeaders = [
      '参加枠名', 'ユーザー名', '表示名', '利用開始日', 'コメント', 
      '参加ステータス', '出欠ステータス', '出席日時'
    ]

    if (!expectedHeaders.every(header => headers.includes(header))) {
      throw new Error('CSVヘッダーが正しくありません')
    }

    const data: Participant[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length >= expectedHeaders.length) {
        const participant: Participant = {
          participantFrame: values[headers.indexOf('参加枠名')] || '',
          username: values[headers.indexOf('ユーザー名')] || '',
          displayName: values[headers.indexOf('表示名')] || '',
          participationStatus: values[headers.indexOf('参加ステータス')] || '',
          attendanceStatus: values[headers.indexOf('出欠ステータス')] || ''
        }
        data.push(participant)
      }
    }
    return data
  }

  const filterEligibleParticipants = (participants: Participant[]): Participant[] => {
    const winnerUsernames = new Set((winners || []).map(w => w.username))
    
    return participants.filter(p => 
      p.attendanceStatus === '出席' && 
      p.participantFrame !== '運営枠' &&
      !winnerUsernames.has(p.username)
    )
  }

  const handleImportCSV = () => {
    if (!csvText.trim()) {
      toast.error('CSVデータを入力してください')
      return
    }

    try {
      const parsed = parseCSV(csvText)
      setParticipants(parsed)
      const eligible = filterEligibleParticipants(parsed)
      setEligibleParticipants(eligible)
      toast.success(`CSVデータを読み込みました（対象者: ${eligible.length}名）`)
    } catch (error) {
      toast.error('CSVデータの解析に失敗しました: ' + (error as Error).message)
    }
  }

  const executeLottery = async () => {
    if (eligibleParticipants.length === 0) {
      toast.error('抽選対象者がいません')
      return
    }

    setIsProcessing(true)
    
    await new Promise(resolve => setTimeout(resolve, 1000))

    const randomIndex = Math.floor(Math.random() * eligibleParticipants.length)
    const winner = eligibleParticipants[randomIndex]

    setWinners(currentWinners => [...(currentWinners || []), winner])
    
    const newEligible = eligibleParticipants.filter(p => p.username !== winner.username)
    setEligibleParticipants(newEligible)

    setIsProcessing(false)
    toast.success(`当選者が決定しました！`)
  }

  const resetLottery = () => {
    // 当選者データを削除
    deleteWinners()
    // 空の当選者リストで抽選対象者を再計算
    const winnerUsernames = new Set<string>()
    const resetEligible = participants.filter(p => 
      p.attendanceStatus === '出席' && 
      p.participantFrame !== '運営枠' &&
      !winnerUsernames.has(p.username)
    )
    setEligibleParticipants(resetEligible)
    toast.success('抽選をリセットしました')
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">イベント抽選アプリ</h1>
          <p className="text-muted-foreground">VS Code Meet Up 参加者抽選システム</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload size={20} />
              CSVデータ入力
            </CardTitle>
            <CardDescription>
              参加者データのCSVテキストを貼り付けてください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="参加枠名,ユーザー名,表示名,利用開始日,コメント,参加ステータス,出欠ステータス,出席日時,..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <Button onClick={handleImportCSV} className="w-full">
              CSVデータを読み込み
            </Button>
          </CardContent>
        </Card>

        {participants.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users size={20} className="text-muted-foreground" />
                  <span className="font-semibold">総参加者数</span>
                </div>
                <div className="text-2xl font-bold text-primary">{participants.length}名</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Play size={20} className="text-muted-foreground" />
                  <span className="font-semibold">抽選対象者</span>
                </div>
                <div className="text-2xl font-bold text-accent">{eligibleParticipants.length}名</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy size={20} className="text-muted-foreground" />
                  <span className="font-semibold">当選者数</span>
                </div>
                <div className="text-2xl font-bold text-destructive">{(winners || []).length}名</div>
              </CardContent>
            </Card>
          </div>
        )}

        {eligibleParticipants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play size={20} />
                抽選実行
              </CardTitle>
              <CardDescription>
                抽選対象者から1名をランダムに選出します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={executeLottery} 
                  disabled={isProcessing}
                  className="flex-1"
                  size="lg"
                >
                  {isProcessing ? '抽選中...' : '抽選実行'}
                </Button>
                <Button 
                  onClick={resetLottery} 
                  variant="outline"
                  disabled={!winners || winners.length === 0}
                >
                  リセット
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {winners && winners.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy size={20} />
                抽選結果
              </CardTitle>
              <CardDescription>
                当選者一覧（最新の当選者が上に表示されます）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {winners.slice().reverse().map((winner, index) => (
                  <div key={`${winner.username}-${winners.length - index}`} className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-accent text-accent-foreground">
                        第{winners.length - index}回
                      </Badge>
                      <div>
                        <div className="font-semibold text-lg">
                          {winner.displayName || winner.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ユーザー名: {winner.username} | 参加枠: {winner.participantFrame}
                        </div>
                      </div>
                    </div>
                    <Trophy size={24} className="text-accent" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {participants.length > 0 && eligibleParticipants.length === 0 && winners && winners.length > 0 && (
          <Card className="border-accent">
            <CardContent className="p-6 text-center">
              <Trophy size={48} className="mx-auto mb-4 text-accent" />
              <h3 className="text-xl font-bold mb-2">抽選完了</h3>
              <p className="text-muted-foreground">
                すべての対象者から抽選が完了しました
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App