import ReactDOM from 'react-dom/client'
import { PanelApp } from '@/panel/App'
import panelCss from '@/styles/panel.css?inline'

console.info('[TuneNest] content script loaded', location.href)

// 创建 Shadow DOM 容器
const existing = document.getElementById('tune-nest-root')
if (existing) {
  existing.remove()
}

const hostEl = document.createElement('div')
hostEl.id = 'tune-nest-root'
hostEl.style.position = 'fixed'
hostEl.style.inset = '0'
hostEl.style.zIndex = '2147483647'
hostEl.style.pointerEvents = 'none';
(document.body || document.documentElement).appendChild(hostEl)

const shadow = hostEl.attachShadow({ mode: 'open' })

const styleEl = document.createElement('style')
styleEl.textContent = `
  #tune-nest-app {
    position: fixed;
    z-index: 2147483647;
    inset: 0;
    pointer-events: none;
  }
  #tune-nest-app * {
    pointer-events: auto;
  }
  .tn-fab {
    position: fixed !important;
    z-index: 2147483647 !important;
    left: 24px !important;
    bottom: 96px !important;
    width: 52px !important;
    height: 52px !important;
    border-radius: 9999px !important;
    background: #e63946 !important;
    color: #fff !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border: none !important;
    box-shadow: 0 10px 24px rgba(0,0,0,.22) !important;
    cursor: pointer !important;
    font-size: 22px !important;
  }
  .tn-fab-wrap {
    position: fixed !important;
    z-index: 2147483647 !important;
    left: 24px !important;
    right: auto !important;
    bottom: 96px !important;
  }
  .tn-login-hint {
    left: 0 !important;
    right: auto !important;
  }
  ${panelCss}
`
shadow.appendChild(styleEl)

// React 挂载点
const mountEl = document.createElement('div')
mountEl.id = 'tune-nest-app'
shadow.appendChild(mountEl)

// 渲染 React 应用
const root = ReactDOM.createRoot(mountEl)
root.render(<PanelApp />)
