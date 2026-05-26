import type { Song, ClassifyResult } from '@/types'

// ===== 语种/地区映射（基于歌手名常见特征） =====

const CJK_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]/
const JAPANESE_REGEX = /[\u3040-\u309f\u30a0-\u30ff]/
const KOREAN_REGEX = /[\uac00-\ud7af\u1100-\u11ff]/

// ===== 情绪关键词（基础匹配） =====

const MOOD_KEYWORDS: Record<string, string[]> = {
  '激情': ['摇滚', 'rock', 'metal', 'punk', '嗨', '燃', '电子', 'EDM', 'dance', '热血', 'hip-hop', 'rap', '说唱', 'hard', 'heavy', '派对', 'party', '活力', 'bass', 'drop', 'remix'],
  '舒缓': ['轻音乐', '钢琴', 'piano', '安静', '治愈', '催眠', '纯音乐', 'light', 'easy', 'ambient', 'new age', 'chill', '小清新', 'lofi', 'lo-fi', '伤感', '情歌', 'ballad', 'slow', '慢', '思念', 'acoustic'],
}

// ===== 情绪标签关键词（匹配网易云标签） =====

const MOOD_TAG_KEYWORDS: Record<string, string[]> = {
  '激情': ['激情', '热血', '兴奋', '嗨', '燃', '运动', '健身', '派对', '欢快', '快乐', '活力', '阳光', '开心'],
  '舒缓': ['安静', '舒缓', '放松', '治愈', '助眠', '冥想', '轻松', '清新', '伤感', '悲伤', '忧郁', '思念', '浪漫', '甜蜜', '孤独'],
}

// ===== 风格 → 情绪反推（降级策略） =====

const GENRE_TO_MOOD: Record<string, string> = {
  '摇滚': '激情',
  '金属': '激情',
  '嘻哈': '激情',
  '电子': '激情',
  '古典': '舒缓',
  '爵士': '舒缓',
  '民谣': '舒缓',
  '国风': '舒缓',
  'R&B': '舒缓',
}

// ===== 风格关键词 =====

const GENRE_KEYWORDS: Record<string, string[]> = {
  '流行': ['pop', '流行'],
  '摇滚': ['rock', '摇滚', 'punk', '朋克'],
  'R&B': ['r&b', 'rnb', 'soul', '灵魂'],
  '嘻哈': ['hip-hop', 'hiphop', 'rap', '说唱', '嘻哈'],
  '电子': ['electronic', 'EDM', 'techno', 'house', 'trance', '电子'],
  '民谣': ['folk', '民谣', '民歌'],
  '古典': ['classical', '古典', '交响', 'symphony', '奏鸣'],
  '爵士': ['jazz', '爵士'],
  '金属': ['metal', '金属'],
  '乡村': ['country', '乡村'],
  'ACG': ['动漫', '动画', 'anime', '游戏', 'game', 'ost', '原声'],
  '国风': ['古风', '国风', '中国风', '戏腔', '二胡', '古筝', '琵琶'],
}

// ===== 年代判定 =====

function classifyEra(publishTime?: number): string | undefined {
  if (!publishTime) return undefined
  const year = new Date(publishTime).getFullYear()
  if (year < 1970) return '60s及更早'
  if (year < 1980) return '70s'
  if (year < 1990) return '80s'
  if (year < 2000) return '90s'
  if (year < 2010) return '00s'
  if (year < 2020) return '10s'
  return '20s'
}

// ===== 语种判定 =====

function classifyLanguage(song: Song): { language?: string; region?: string } {
  const artistNames = song.artists.map((a) => a.name).join(' ')
  const text = `${song.name} ${artistNames} ${song.album.name}`

  if (JAPANESE_REGEX.test(text)) {
    return { language: '日语', region: '日本' }
  }
  if (KOREAN_REGEX.test(text)) {
    return { language: '韩语', region: '韩国' }
  }
  if (CJK_REGEX.test(artistNames)) {
    return { language: '华语', region: '华语' }
  }

  const hasLatin = /[a-zA-Z]/.test(artistNames)
  if (hasLatin) {
    return { language: '英语', region: '欧美' }
  }

  return {}
}

// ===== 关键词匹配 =====

function matchKeywords(
  text: string,
  keywordMap: Record<string, string[]>
): string | undefined {
  const lower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(keywordMap)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return category
      }
    }
  }
  return undefined
}

// ===== 情绪分类（三级降级） =====

function classifyMood(fullText: string, tags: string[], genre?: string): string | undefined {
  // Level 1: 关键词直接匹配
  const byKeyword = matchKeywords(fullText, MOOD_KEYWORDS)
  if (byKeyword) return byKeyword

  // Level 2: 网易云标签匹配
  if (tags.length > 0) {
    const tagText = tags.join(' ').toLowerCase()
    for (const [mood, keywords] of Object.entries(MOOD_TAG_KEYWORDS)) {
      for (const kw of keywords) {
        if (tagText.includes(kw)) return mood
      }
    }
  }

  // Level 3: 风格反推情绪
  if (genre && GENRE_TO_MOOD[genre]) {
    return GENRE_TO_MOOD[genre]
  }

  return undefined
}

// ===== 主分类函数 =====

export function classifyByRules(song: Song): ClassifyResult {
  const tags = song.tags || []
  const tagText = tags.join(' ')
  const fullText = `${song.name} ${song.artists.map((a) => a.name).join(' ')} ${song.album.name} ${tagText}`

  const { language, region } = classifyLanguage(song)
  const genre = matchKeywords(fullText, GENRE_KEYWORDS)
  const mood = classifyMood(fullText, tags, genre)
  const era = classifyEra(song.album.publishTime)

  return {
    songId: song.id,
    songName: song.name,
    artists: song.artists.map((a) => a.name).join(' / '),
    mood,
    language,
    region,
    era,
    genre,
    source: 'rule',
  }
}
