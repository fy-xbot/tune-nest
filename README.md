# TuneNest - 网易云音乐智能歌单分类

Chrome 浏览器插件，自动分类网易云音乐收藏歌单，按情绪、语种、地区、年代、风格创建新歌单。

## 功能

- **规则分类**：基于歌曲标签、歌手名、发行时间等元数据自动分类
- **AI 分类**：规则无法判定时，调用 DeepSeek API 进行智能分类
- **自动创建歌单**：一键在网易云创建分类后的新歌单
- **页面内嵌 UI**：悬浮按钮 + 侧边面板，不离开网易云页面即可操作

## 分类维度

| 维度 | 示例 |
|------|------|
| 情绪 | 激情、舒缓、悲伤、浪漫、欢快 |
| 语种 | 华语、英语、日语、韩语、粤语 |
| 地区 | 华语、欧美、日本、韩国 |
| 年代 | 70s、80s、90s、00s、10s、20s |
| 风格 | 流行、摇滚、电子、民谣、嘻哈、古典、ACG、国风等 |

## 开发

```bash
# 安装依赖
npm install

# 开发模式（热更新）
npm run dev

# 构建
npm run build
```

## 加载插件

1. 运行 `npm run dev` 或 `npm run build`
2. 打开 Chrome → `chrome://extensions/`
3. 启用「开发者模式」
4. 点击「加载已解压的扩展程序」，选择 `dist/` 目录
5. 打开 [网易云音乐](https://music.163.com)，右下角会出现悬浮按钮

## 配置 DeepSeek API

1. 点击插件图标 → 设置（或 `chrome://extensions/` → TuneNest → 选项）
2. 输入 DeepSeek API Key
3. 测试连通性后保存

## 技术栈

- Chrome Extension Manifest V3
- Vite + CRXJS
- React 18 + TailwindCSS
- TypeScript
- DeepSeek API
