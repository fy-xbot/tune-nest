// 测试获取用户播放记录 Top10
// 需要在网易云页面 console 里跑，或者手动带 cookie

const uid = process.argv[2]
if (!uid) { console.error('Usage: node test-play-record.mjs <uid>'); process.exit(1) }

// 这个接口需要登录态 cookie，从浏览器直接调用才行
// 这里仅展示 API 格式

console.log(`
📋 网易云播放记录 API 说明：

接口: POST https://music.163.com/api/v1/play/record
参数: uid=${uid}, type=0 (全部时间) 或 type=1 (最近一周)

返回格式:
{
  "allData": [  // type=0 时
    {
      "playCount": 156,
      "score": 100,
      "song": { "id": xxx, "name": "歌名", "ar": [...], "al": {...} }
    },
    ...
  ]
}

⚠️  注意：
1. 需要登录态（cookie），只能在 content script 里调用
2. 部分用户设置了隐私，他人的记录可能拿不到
3. 返回最多 100 首，按播放次数降序

💡 用法建议：
- 可以在扩展面板里加个"我的最爱 Top10"展示
- 用 playCount 做加权，高频播放的歌分类优先级更高
- 也可以作为分类结果的验证参考
`)
