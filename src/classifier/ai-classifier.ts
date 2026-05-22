import type { ClassifyResult, DimensionSelection, ClassifyDimension } from '@/types'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface SongInput {
  id: number
  name: string
  artists: string
  album: string
}

interface AIClassifyOutput {
  id: number
  mood?: string
  language?: string
  region?: string
  era?: string
  genre?: string
}

const DIM_LABELS: Record<ClassifyDimension, string> = {
  mood: '情绪', language: '语种', region: '地区', era: '年代', genre: '风格',
}

const DIM_HINTS: Record<ClassifyDimension, Record<string, string>> = {
  mood: {
    '激情': '力量感强、热血燃烧、强烈嘲讶或反叛，如《海阔天空》《Numb》',
    '舒缓': '平静放松、节奏轻柔、无明显情绪波动，如《平凡之路》',
    '悲伤': '忧伤、失去、遗憾、歌词含离别/思念/痛苦，如《起风了》《红豆》《Faded》',
    '浪漫': '爱情甲蜜、温馨告白、幸福感，如《告白气球》《小幸运》',
    '欢快': '轻快活泼、无忧无虑、节日/派对氛围，如《晴天》《Shape of You》',
  },
  genre: {
    '流行': '大众化旋律、朗朗上口、排行榜风格',
    '摇滚': '吉他失真/riff主导、强节拍、反叛感',
    'R&B': '节奏布鲁斯、灵魂乐、律动感、funk 元素',
    '嘻哈': 'Rap/说唱主导、Hip-hop 节拍',
    '电子': '合成器/电子音色为主、EDM/house/trance',
    '民谣': '吉他弹唱、叙事性、朴素编曲',
    '古典': '管弦乐/钢琴曲、古典作曲家（包含纯音乐）',
    '爵士': '即兴演奏、swing、布鲁斯和声',
    'ACG': '动漫/游戏主题曲、日系配乐、Vocaloid',
    '国风': '中国传统乐器、古风歌词、民族调式',
  },
  language: {},
  region: {},
  era: {},
}

function buildSystemPrompt(selection: DimensionSelection, dimsToClassify: ClassifyDimension[]): string {
  const dimLines = dimsToClassify.map((dim) => {
    const cats = selection[dim] || []
    const hints = DIM_HINTS[dim] || {}
    const catStr = cats.map((c) => {
      const hint = hints[c]
      return hint ? `${c}（${hint}）` : c
    }).join(' | ')
    return `- ${dim}（${DIM_LABELS[dim]}）: ${catStr}`
  }).join('\n')
  const fields = dimsToClassify.map((dim) => `"${dim}": "..."`).join(', ')

  const examples = [
    { id: 12345, name: '晴天 - 周杰伦 | 专辑:叶惠美', values: { mood: '欢快', language: '华语', genre: '流行', era: '00s', region: '华语' } },
    { id: 67890, name: 'Faded - Alan Walker | 专辑:Different World', values: { mood: '悲伤', language: '英语', genre: '电子', era: '10s', region: '欧美' } },
    { id: 11111, name: '告白气球 - 周杰伦 | 专辑:周杰伦的床边故事', values: { mood: '浪漫', language: '华语', genre: '流行', era: '10s', region: '华语' } },
  ]
  const exInput = examples.map((e) => `ID:${e.id} | ${e.name}`).join('\n')
  const exOutput = JSON.stringify(examples.map((e) => {
    const obj: Record<string, unknown> = { id: e.id }
    dimsToClassify.forEach((d) => { obj[d] = e.values[d] || null })
    return obj
  }))

  return `你是一个音乐分类专家。根据歌名、歌手、专辑信息对歌曲分类。

分类维度和可选值：
${dimLines}

规则：
1. 只能从给定的可选值中选择，不要发明新类别
2. 如果无法确定某个维度，设为 null
3. 先在心里分析每首歌的特征，但只输出 JSON 结果
4. 情绪判定优先级：歌词主题 > 整体氛围 > 节奏快慢。歌词内容表达失去/思念/遗憾就是悲伤，即使旋律轻柔
5. 风格判定优先级：歌手代表风格 > 编曲元素。如歌手以 Rap 为主则归嘻哈，即使单曲有流行元素
6. 纯音乐（无人声）的语种设为 null

示例输入：
${exInput}

示例输出：
${exOutput}

请严格按以下 JSON 格式返回：
[{"id": 歌曲id, ${fields}}]`
}

export async function classifyByAI(
  songs: SongInput[],
  apiKey: string,
  dimensionSelection: DimensionSelection,
  existingResults?: Map<number, ClassifyResult>
): Promise<Map<number, Partial<AIClassifyOutput>>> {
  const selectedDims = Object.keys(dimensionSelection) as ClassifyDimension[]

  const songsWithNeededDims = songs.map((s) => {
    const existing = existingResults?.get(s.id)
    const needed = existing
      ? selectedDims.filter((d) => !existing[d])
      : selectedDims
    return { song: s, needed }
  }).filter((x) => x.needed.length > 0)

  if (songsWithNeededDims.length === 0) {
    return new Map()
  }

  const dimsToClassify = [...new Set(songsWithNeededDims.flatMap((x) => x.needed))]

  const userLines = songsWithNeededDims.map(({ song, needed }) => {
    const existing = existingResults?.get(song.id)
    const knownParts = existing
      ? selectedDims.filter((d) => !needed.includes(d) && existing[d]).map((d) => `${DIM_LABELS[d]}=${existing[d]}`).join(', ')
      : ''
    const knownHint = knownParts ? ` [已知: ${knownParts}]` : ''
    return `ID:${song.id} | ${song.name} - ${song.artists} | 专辑:${song.album}${knownHint}`
  })

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: buildSystemPrompt(dimensionSelection, dimsToClassify) },
    { role: 'user', content: userLines.join('\n') },
  ]

  const estimatedTokensPerSong = 30 + dimsToClassify.length * 15
  const maxTokens = Math.min(Math.max(songsWithNeededDims.length * estimatedTokensPerSong, 512), 8192)

  const res = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`DeepSeek API error: ${res.status} ${errText}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''

  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('DeepSeek 返回格式异常，无法解析 JSON')
  }

  const parsed: AIClassifyOutput[] = JSON.parse(jsonMatch[0])
  const resultMap = new Map<number, Partial<AIClassifyOutput>>()

  for (const item of parsed) {
    resultMap.set(item.id, {
      mood: item.mood,
      language: item.language,
      region: item.region,
      era: item.era,
      genre: item.genre,
    })
  }

  return resultMap
}
