import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

const normalizedPath =
  window.location.pathname.replace(/\/$/, '') || '/'

const root = ReactDOM.createRoot(document.getElementById('root')!)

async function mount() {
  if (normalizedPath === '/config-editor') {
    const { default: ConfigEditor } = await import('./configEditor/ConfigEditor')
    root.render(
      <React.StrictMode>
        <ConfigEditor />
      </React.StrictMode>,
    )
    return
  }

  const { default: App } = await import('./App')
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

mount().catch((err: unknown) => {
  console.error(err)
  const message = err instanceof Error ? err.message : String(err)
  root.render(
    <div
      style={{
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 560,
        margin: '48px auto',
      }}
    >
      <h1 style={{ fontSize: '1.1rem' }}>起動に失敗しました</h1>
      <pre
        style={{
          background: '#f5f5f5',
          padding: 12,
          overflow: 'auto',
          fontSize: 13,
        }}
      >
        {message}
      </pre>
      <p style={{ color: '#555', fontSize: 14 }}>
        アンケート画面は <code>.env.local</code> に{' '}
        <code>VITE_SURVEY_CONFIG</code> などが必要です。設定ジェネレータは{' '}
        <a href="/config-editor">/config-editor</a> を開いてください。
      </p>
    </div>,
  )
})
