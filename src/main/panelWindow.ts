import { app, BrowserWindow, screen, type Rectangle } from 'electron'
import { join } from 'node:path'

const panelWidth = 320
const edgeGap = 10
const reopenGuardMs = 250

export interface PanelWindow {
  window: BrowserWindow
  toggle: (trayBounds: Rectangle) => void
  setContentHeight: (height: number) => void
}

function positionNear(window: BrowserWindow, trayBounds: Rectangle): void {
  const [, height = 0] = window.getSize()
  const trayCenter = { x: trayBounds.x + trayBounds.width / 2, y: trayBounds.y + trayBounds.height / 2 }
  const { workArea } = screen.getDisplayNearestPoint(trayCenter)
  const x = Math.min(
    Math.max(Math.round(trayCenter.x - panelWidth / 2), workArea.x + edgeGap),
    workArea.x + workArea.width - panelWidth - edgeGap
  )
  const taskbarAtBottom = trayCenter.y > workArea.y + workArea.height / 2
  const y = taskbarAtBottom ? workArea.y + workArea.height - height - edgeGap : workArea.y + edgeGap
  window.setPosition(x, y)
}

export function createPanelWindow(onShow: () => void): PanelWindow {
  const window = new BrowserWindow({
    width: panelWidth,
    height: 240,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: '#1b1a18',
    webPreferences: {
      preload: join(__dirname, '../preload/panel.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  let hiddenAt = 0
  let lastTrayBounds: Rectangle | null = null
  window.on('blur', () => {
    hiddenAt = Date.now()
    window.hide()
  })
  let isQuitting = false
  app.on('before-quit', () => {
    isQuitting = true
  })
  window.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    window.hide()
  })
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event) => event.preventDefault())

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(`${process.env.ELECTRON_RENDERER_URL}/panel/index.html`)
  } else {
    void window.loadFile(join(__dirname, '../renderer/panel/index.html'))
  }

  return {
    window,
    toggle: (trayBounds) => {
      if (window.isVisible() || Date.now() - hiddenAt < reopenGuardMs) {
        window.hide()
        return
      }
      lastTrayBounds = trayBounds
      positionNear(window, trayBounds)
      window.show()
      window.focus()
      onShow()
    },
    setContentHeight: (height) => {
      const clampedHeight = Math.min(Math.max(Math.ceil(height), 120), 600)
      window.setContentSize(panelWidth, clampedHeight)
      if (lastTrayBounds) positionNear(window, lastTrayBounds)
    }
  }
}
