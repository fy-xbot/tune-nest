(() => {
  const reveal = document.querySelector('[data-reveal]');
  if (reveal && typeof IntersectionObserver !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveal.classList.add('reveal-ready');
    reveal.querySelectorAll('span').forEach((word, index) => { word.style.transitionDelay = `${index * 60}ms`; });
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { reveal.classList.add('revealed'); observer.disconnect(); }
    }, { threshold: 0.3 });
    observer.observe(reveal);
  }
  const repository = 'fy-xbot/tune-nest';
  const releasesUrl = `https://github.com/${repository}/releases`;
  const status = document.getElementById('desktop-release-status');
  const button = document.getElementById('desktop-download-link');
  const detail = document.getElementById('desktop-release-detail');
  const trustedAsset = asset => {
    try {
      const url = new URL(asset.browser_download_url);
      return url.protocol === 'https:' && url.hostname === 'github.com' && url.pathname.startsWith(`/${repository}/releases/download/`);
    } catch { return false; }
  };
  const show = releases => {
    const candidates = Array.isArray(releases) ? releases.filter(release => !release.draft).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at)) : [];
    for (const release of candidates) {
      const asset = (release.assets || []).find(file => /\.exe$/i.test(file.name) && /x64|windows|setup/i.test(file.name) && trustedAsset(file));
      if (!asset) continue;
      status.textContent = `${release.tag_name} · Windows 安装包${release.prerelease ? ' · 测试版' : ''}`;
      button.href = asset.browser_download_url;
      button.textContent = release.prerelease ? '下载 Windows 测试版 ↓' : '下载 Windows 安装包 ↓';
      detail.textContent = '下载来源：fy-xbot/tune-nest · GitHub Releases';
      return true;
    }
    status.textContent = '新版桌面安装包准备中';
    button.href = releasesUrl;
    button.textContent = '查看发布记录 ↗';
    detail.textContent = '当前没有查到公开的 Windows 安装包，历史扩展包请从扩展入口查看。';
    return false;
  };
  fetch(`https://api.github.com/repos/${repository}/releases?per_page=20`, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(8000) })
    .then(response => { if (!response.ok) throw new Error('release lookup failed'); return response.json(); })
    .then(show)
    .catch(() => {
      status.textContent = '请前往发布页查看可用安装包';
      button.href = releasesUrl;
      button.textContent = '查看发布记录 ↗';
      detail.textContent = '暂时无法查询版本，发布页可查看实际附件。';
    });
  document.querySelectorAll('a[href="#privacy"],a[href="#usage"]').forEach(link => link.addEventListener('click', () => {
    const panel = document.querySelector(link.getAttribute('href'));
    if (panel) panel.open = true;
  }));
})();
