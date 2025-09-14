import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Upload, Trophy, Users, Confetti, Star } from "@phosphor-icons/react"
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
  const [showWinnerDialog, setShowWinnerDialog] = useState(false)
  const [currentWinner, setCurrentWinner] = useState<Participant | null>(null)

  // 改良されたCSV解析関数（引用符で囲まれた値を適切に処理）
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  const parseCSV = (text: string): Participant[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''))
    const expectedHeaders = [
      '参加枠名', 'ユーザー名', '表示名', '利用開始日', 'コメント', 
      '参加ステータス', '出欠ステータス', '出席日時'
    ]

    if (!expectedHeaders.every(header => headers.includes(header))) {
      throw new Error('CSVヘッダーが正しくありません')
    }

    const data: Participant[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.trim().replace(/"/g, ''))
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
      
      // 参加枠名の統計を表示
      const frameStats = parsed.reduce((acc, p) => {
        acc[p.participantFrame] = (acc[p.participantFrame] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const attendeesByFrame = parsed.filter(p => p.attendanceStatus === '出席').reduce((acc, p) => {
        acc[p.participantFrame] = (acc[p.participantFrame] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log('参加枠統計:', frameStats)
      console.log('出席者の参加枠統計:', attendeesByFrame)
      
      toast.success(
        `CSVデータを読み込みました（総参加者: ${parsed.length}名、抽選対象者: ${eligible.length}名）`
      )
    } catch (error) {
      toast.error('CSVデータの解析に失敗しました: ' + (error as Error).message)
    }
  }

  // Web Audio APIでドラムロール音を生成・再生
  const playDrumroll = () => {
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.type = 'sawtooth'
    oscillator.frequency.setValueAtTime(80, audioContext.currentTime)
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.4)
    
    // ドラムロールのロール効果（高速繰り返し）
    const now = audioContext.currentTime
    for (let i = 0; i < 30; i++) {
      const time = now + (i * 0.05)
      gainNode.gain.setValueAtTime(0.3, time)
      gainNode.gain.exponentialRampToValueAtTime(0.05, time + 0.04)
    }
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 1.4)
    
    return audioContext
  }

  // ファンファーレ音を生成・再生
  const playFanfare = () => {
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.type = 'triangle'
    
    // ファンファーレメロディー
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    const duration = 0.3
    
    notes.forEach((freq, index) => {
      const startTime = audioContext.currentTime + (index * duration)
      oscillator.frequency.setValueAtTime(freq, startTime)
      gainNode.gain.setValueAtTime(0.4, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
    })
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + (notes.length * duration))
    
    return audioContext
  }

  const executeLottery = async () => {
    if (eligibleParticipants.length === 0) {
      toast.error('抽選対象者がいません')
      return
    }

    setIsProcessing(true)
    
    // ドラムロール音を再生
    try {
      playDrumroll()
    } catch (error) {
      console.warn('Audio playback failed:', error)
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500))

    const randomIndex = Math.floor(Math.random() * eligibleParticipants.length)
    const winner = eligibleParticipants[randomIndex]

    setWinners(currentWinners => [...(currentWinners || []), winner])
    
    const newEligible = eligibleParticipants.filter(p => p.username !== winner.username)
    setEligibleParticipants(newEligible)

    setCurrentWinner(winner)
    setShowWinnerDialog(true)
    setIsProcessing(false)
    
    // 結果発表時にファンファーレ音を再生
    try {
      setTimeout(() => playFanfare(), 200)
    } catch (error) {
      console.warn('Audio playback failed:', error)
    }
  }

  const resetLottery = () => {
    // 当選者データを削除
    deleteWinners()
    // 参加者データから抽選対象者を再計算（当選者なしの状態で）
    const resetEligible = participants.filter(p => 
      p.attendanceStatus === '出席' && 
      p.participantFrame !== '運営枠'
    )
    setEligibleParticipants(resetEligible)
    toast.success(`抽選をリセットしました（抽選対象者: ${resetEligible.length}名）`)
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
          <>
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

            {/* 参加枠別統計 */}
            <Card>
              <CardHeader>
                <CardTitle>参加枠別統計</CardTitle>
                <CardDescription>
                  出席者の参加枠別内訳（抽選対象は「運営枠」以外の出席者）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {(() => {
                    const attendeesByFrame = participants
                      .filter(p => p.attendanceStatus === '出席')
                      .reduce((acc, p) => {
                        acc[p.participantFrame] = (acc[p.participantFrame] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    
                    return Object.entries(attendeesByFrame).map(([frame, count]) => (
                      <div key={frame} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="font-medium">{frame}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={frame === '運営枠' ? 'secondary' : 'default'}>
                            {count}名
                          </Badge>
                          {frame !== '運営枠' && (
                            <span className="text-xs text-green-600">抽選対象</span>
                          )}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </CardContent>
            </Card>
          </>
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
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>抽選中... 🥁</span>
                    </div>
                  ) : (
                    '抽選実行'
                  )}
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

        {/* 当選者発表ダイアログ */}
        <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
          <DialogContent className="max-w-md mx-auto">
            <div className="text-center space-y-6 py-6">
              {/* 派手なアニメーション要素 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 rounded-full opacity-20 animate-pulse"></div>
                </div>
                <div className="relative flex items-center justify-center">
                  <Trophy size={64} className="text-yellow-500 animate-bounce" />
                </div>
              </div>

              {/* 当選発表 */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-foreground animate-pulse">
                  🎉 当選者発表 🎉
                </h2>
                
                {currentWinner && (
                  <div className="space-y-3 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-300">
                    <div className="flex items-center justify-center gap-2">
                      <Star size={24} className="text-yellow-500" />
                      <Badge variant="destructive" className="text-lg px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500">
                        第{(winners || []).length}回当選
                      </Badge>
                      <Star size={24} className="text-yellow-500" />
                    </div>
                    
                    <div className="text-2xl font-bold text-foreground">
                      {currentWinner.displayName || currentWinner.username}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>ユーザー名: {currentWinner.username}</div>
                      <div>参加枠: {currentWinner.participantFrame}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-lg">
                  <Confetti size={24} className="text-pink-500" />
                  <span className="font-semibold text-foreground">おめでとうございます！</span>
                  <Confetti size={24} className="text-pink-500" />
                </div>
              </div>

              {/* 閉じるボタン */}
              <Button 
                onClick={() => setShowWinnerDialog(false)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                size="lg"
              >
                閉じる
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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