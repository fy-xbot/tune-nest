// 测试 AI 分类准确率
const API_KEY = process.argv[2]
if (!API_KEY) { console.error('Usage: node test-ai-classify.mjs <api-key>'); process.exit(1) }

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'

// 30 首已知分类的歌曲
const TEST_SONGS = [
  { id: 1, name: '晴天', artists: '周杰伦', album: '叶惠美', expected: { mood: '欢快', language: '华语', genre: '流行', era: '00s', region: '华语' } },
  { id: 2, name: 'Bohemian Rhapsody', artists: 'Queen', album: 'A Night at the Opera', expected: { mood: '激情', language: '英语', genre: '摇滚', era: '70s', region: '欧美' } },
  { id: 3, name: '海阔天空', artists: 'Beyond', album: '乐与怒', expected: { mood: '激情', language: '粤语', genre: '摇滚', era: '90s', region: '华语' } },
  { id: 4, name: 'Shape of You', artists: 'Ed Sheeran', album: '÷', expected: { mood: '欢快', language: '英语', genre: '流行', era: '10s', region: '欧美' } },
  { id: 5, name: '千本桜', artists: '初音ミク', album: '千本桜', expected: { mood: '激情', language: '日语', genre: 'ACG', era: '10s', region: '日本' } },
  { id: 6, name: 'Lose Yourself', artists: 'Eminem', album: '8 Mile', expected: { mood: '激情', language: '英语', genre: '嘻哈', era: '00s', region: '欧美' } },
  { id: 7, name: '成都', artists: '赵雷', album: '无法长大', expected: { mood: '舒缓', language: '华语', genre: '民谣', era: '10s', region: '华语' } },
  { id: 8, name: 'Blinding Lights', artists: 'The Weeknd', album: 'After Hours', expected: { mood: '激情', language: '英语', genre: '流行', era: '20s', region: '欧美' } },
  { id: 9, name: '残酷な天使のテーゼ', artists: '高橋洋子', album: 'EVA', expected: { mood: '激情', language: '日语', genre: 'ACG', era: '90s', region: '日本' } },
  { id: 10, name: '夜曲', artists: '周杰伦', album: '十一月的萧邦', expected: { mood: '浪漫', language: '华语', genre: '流行', era: '00s', region: '华语' } },
  { id: 11, name: 'Hotel California', artists: 'Eagles', album: 'Hotel California', expected: { mood: '舒缓', language: '英语', genre: '摇滚', era: '70s', region: '欧美' } },
  { id: 12, name: '起风了', artists: '买辣椒也用券', album: '起风了', expected: { mood: '悲伤', language: '华语', genre: '流行', era: '10s', region: '华语' } },
  { id: 13, name: 'Gangnam Style', artists: 'PSY', album: 'PSY 6甲', expected: { mood: '欢快', language: '韩语', genre: '流行', era: '10s', region: '韩国' } },
  { id: 14, name: '青花瓷', artists: '周杰伦', album: '我很忙', expected: { mood: '舒缓', language: '华语', genre: '国风', era: '00s', region: '华语' } },
  { id: 15, name: 'Numb', artists: 'Linkin Park', album: 'Meteora', expected: { mood: '激情', language: '英语', genre: '摇滚', era: '00s', region: '欧美' } },
  { id: 16, name: '告白气球', artists: '周杰伦', album: '周杰伦的床边故事', expected: { mood: '浪漫', language: '华语', genre: '流行', era: '10s', region: '华语' } },
  { id: 17, name: 'Faded', artists: 'Alan Walker', album: 'Different World', expected: { mood: '悲伤', language: '英语', genre: '电子', era: '10s', region: '欧美' } },
  { id: 18, name: '富士山下', artists: '陈奕迅', album: 'What\'s Going On', expected: { mood: '悲伤', language: '粤语', genre: '流行', era: '00s', region: '华语' } },
  { id: 19, name: 'Fly Me to the Moon', artists: 'Frank Sinatra', album: 'It Might as Well Be Swing', expected: { mood: '浪漫', language: '英语', genre: '爵士', era: '60s', region: '欧美' } },
  { id: 20, name: '平凡之路', artists: '朴树', album: '猎户星座', expected: { mood: '舒缓', language: '华语', genre: '民谣', era: '10s', region: '华语' } },
  { id: 21, name: 'Uptown Funk', artists: 'Bruno Mars', album: 'Uptown Special', expected: { mood: '欢快', language: '英语', genre: 'R&B', era: '10s', region: '欧美' } },
  { id: 22, name: '红豆', artists: '王菲', album: '唱游', expected: { mood: '悲伤', language: '华语', genre: '流行', era: '90s', region: '华语' } },
  { id: 23, name: 'Despacito', artists: 'Luis Fonsi', album: 'Vida', expected: { mood: '欢快', language: '英语', genre: '流行', era: '10s', region: '欧美' } },
  { id: 24, name: '東京喰種 unravel', artists: 'TK from 凛として時雨', album: 'unravel', expected: { mood: '悲伤', language: '日语', genre: 'ACG', era: '10s', region: '日本' } },
  { id: 25, name: '小幸运', artists: '田馥甄', album: '我的少女时代 OST', expected: { mood: '浪漫', language: '华语', genre: '流行', era: '10s', region: '华语' } },
  { id: 26, name: 'Smells Like Teen Spirit', artists: 'Nirvana', album: 'Nevermind', expected: { mood: '激情', language: '英语', genre: '摇滚', era: '90s', region: '欧美' } },
  { id: 27, name: '권지용 Crooked', artists: 'G-Dragon', album: 'Coup D\'Etat', expected: { mood: '激情', language: '韩语', genre: '流行', era: '10s', region: '韩国' } },
  { id: 28, name: 'Canon in D', artists: 'Pachelbel', album: 'Classical Best', expected: { mood: '舒缓', language: null, genre: '古典', era: null, region: '欧美' } },
  { id: 29, name: '沧海一声笑', artists: '许冠杰', album: '笑傲江湖 OST', expected: { mood: '激情', language: '粤语', genre: '国风', era: '90s', region: '华语' } },
  { id: 30, name: 'Stay', artists: 'The Kid LAROI & Justin Bieber', album: 'F*ck Love 3', expected: { mood: '欢快', language: '英语', genre: '流行', era: '20s', region: '欧美' } },
]

const ALL_DIMS = ['mood', 'language', 'genre', 'era', 'region']

const DIM_LABELS = { mood: '情绪', language: '语种', region: '地区', era: '年代', genre: '风格' }

const DIM_HINTS = {
  mood: { '激情': '力量感强、热血燃烧、强烈嘲讶或反叛，如《海阔天空》《Numb》', '舒缓': '平静放松、节奏轻柔、无明显情绪波动，如《平凡之路》', '悲伤': '忧伤、失去、遗憾、歌词含离别/思念/痛苦，如《起风了》《红豆》《Faded》', '浪漫': '爱情甲蜜、温馨告白、幸福感，如《告白气球》《小幸运》', '欢快': '轻快活泼、无忧无虑、节日/派对氛围，如《晴天》《Shape of You》' },
  genre: { '流行': '大众化旋律、朗朗上口、排行榜风格', '摇滚': '吉他失真/riff主导、强节拍、反叛感', 'R&B': '节奏布鲁斯、灵魂乐、律动感、funk 元素', '嘻哈': 'Rap/说唱主导、Hip-hop 节拍', '电子': '合成器/电子音色为主、EDM/house/trance', '民谣': '吉他弹唱、叙事性、朴素编曲', '古典': '管弦乐/钢琴曲、古典作曲家（包含纯音乐）', '爵士': '即兴演奏、swing、布鲁斯和声', 'ACG': '动漫/游戏主题曲、日系配乐、Vocaloid', '国风': '中国传统乐器、古风歌词、民族调式' },
}

const selection = {
  mood: ['激情', '舒缓', '悲伤', '浪漫', '欢快'],
  language: ['华语', '英语', '日语', '韩语', '粤语'],
  region: ['华语', '欧美', '日本', '韩国'],
  era: ['70s', '80s', '90s', '00s', '10s', '20s'],
  genre: ['流行', '摇滚', 'R&B', '嘻哈', '电子', '民谣', '古典', '爵士', 'ACG', '国风'],
}

function buildPrompt() {
  const dimLines = ALL_DIMS.map((dim) => {
    const cats = selection[dim]
    const hints = DIM_HINTS[dim] || {}
    const catStr = cats.map((c) => {
      const hint = hints[c]
      return hint ? `${c}（${hint}）` : c
    }).join(' | ')
    return `- ${dim}（${DIM_LABELS[dim]}）: ${catStr}`
  }).join('\n')
  const fields = ALL_DIMS.map((d) => `"${d}": "..."`).join(', ')

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
ID:12345 | 晴天 - 周杰伦 | 专辑:叶惠美
ID:67890 | Faded - Alan Walker | 专辑:Different World
ID:11111 | 告白气球 - 周杰伦 | 专辑:周杰伦的床边故事

示例输出：
[{"id":12345,"mood":"欢快","language":"华语","genre":"流行","era":"00s","region":"华语"},{"id":67890,"mood":"悲伤","language":"英语","genre":"电子","era":"10s","region":"欧美"},{"id":11111,"mood":"浪漫","language":"华语","genre":"流行","era":"10s","region":"华语"}]

请严格按以下 JSON 格式返回：
[{"id": 歌曲id, ${fields}}]`
}

async function main() {
  console.log('🎵 TuneNest AI 分类准确率测试')
  console.log(`   测试歌曲: ${TEST_SONGS.length} 首`)
  console.log(`   模型: deepseek-chat\n`)

  const userContent = TEST_SONGS
    .map((s) => `ID:${s.id} | ${s.name} - ${s.artists} | 专辑:${s.album}`)
    .join('\n')

  console.log('⏳ 调用 DeepSeek API...\n')

  const res = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: buildPrompt() },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    console.error(`API 错误: ${res.status} ${await res.text()}`)
    process.exit(1)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || ''
  const usage = data.usage || {}
  console.log(`📊 Token 用量: prompt=${usage.prompt_tokens}, completion=${usage.completion_tokens}, total=${usage.total_tokens}\n`)

  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    console.error('无法解析返回 JSON:\n', content)
    process.exit(1)
  }

  const results = JSON.parse(jsonMatch[0])
  const resultMap = new Map(results.map((r) => [r.id, r]))

  // 统计
  let totalChecks = 0
  let correctChecks = 0
  const dimStats = {}
  ALL_DIMS.forEach((d) => { dimStats[d] = { total: 0, correct: 0 } })
  const errors = []

  for (const song of TEST_SONGS) {
    const ai = resultMap.get(song.id)
    if (!ai) {
      errors.push(`❌ ${song.name} - 未返回结果`)
      continue
    }

    for (const dim of ALL_DIMS) {
      const expected = song.expected[dim]
      const got = ai[dim]
      totalChecks++
      dimStats[dim].total++

      const normalGot = (got === null || got === 'null' || got === undefined) ? null : got
      const normalExp = (expected === null || expected === 'null' || expected === undefined) ? null : expected

      if (normalGot === normalExp) {
        correctChecks++
        dimStats[dim].correct++
      } else {
        errors.push(`❌ ${song.name} | ${DIM_LABELS[dim]}: 期望「${normalExp}」得到「${normalGot}」`)
      }
    }
  }

  const accuracy = ((correctChecks / totalChecks) * 100).toFixed(1)

  console.log('═══════════════════════════════════════')
  console.log(`✅ 总准确率: ${correctChecks}/${totalChecks} (${accuracy}%)`)
  console.log('═══════════════════════════════════════\n')

  console.log('📈 各维度准确率:')
  for (const dim of ALL_DIMS) {
    const s = dimStats[dim]
    const pct = ((s.correct / s.total) * 100).toFixed(1)
    const bar = '█'.repeat(Math.round(s.correct / s.total * 20)) + '░'.repeat(20 - Math.round(s.correct / s.total * 20))
    console.log(`   ${DIM_LABELS[dim].padEnd(4)} ${bar} ${pct}% (${s.correct}/${s.total})`)
  }

  if (errors.length > 0) {
    console.log(`\n🔍 错误明细 (${errors.length} 项):`)
    errors.forEach((e) => console.log(`   ${e}`))
  }
}

main().catch(console.error)
