import { app, ipcMain, Menu, powerMonitor, screen, Tray, type MenuItemConstructorOptions } from 'electron'
import { IpcChannel, sessionLimitOf, type UsageState } from '../shared/usage'
import { enableAutoStartOnFirstRun, isAutoStartEnabled, setAutoStart } from './autoStart'
import { createPanelWindow, type PanelWindow } from './panelWindow'
import { renderTrayIcon } from './trayIcon'
import { createUpdater } from './updater'
import { createUsageMonitor } from './usageMonitor'

let tray: Tray | null = null
let panel: PanelWindow | null = null

function tooltipFor(state: UsageState): string {
  if (!state.snapshot) return `Claude : ${state.errorMessage ?? 'chargement...'}`
  const lines = state.snapshot.limits.map((limit) => `${limit.label} : ${Math.round(limit.percent)} %`)
  if (state.errorMessage) lines.push(state.errorMessage)
  return lines.join('\n').slice(0, 127)
}

function renderState(state: UsageState): void {
  const sessionPercent = state.snapshot ? (sessionLimitOf(state.snapshot)?.percent ?? null) : null
  tray?.setImage(renderTrayIcon(sessionPercent, screen.getPrimaryDisplay().scaleFactor))
  tray?.setToolTip(tooltipFor(state))
  panel?.window.webContents.send(IpcChannel.state, state)
}

const monitor = createUsageMonitor(renderState)
const updater = createUpdater(() => tray?.setContextMenu(buildContextMenu()))

function updateMenuItem(): MenuItemConstructorOptions {
  const readyVersion = updater.getReadyVersion()
  return readyVersion
    ? { label: `Redémarrer pour installer la ${readyVersion}`, click: () => updater.installNow() }
    : { label: 'Rechercher des mises à jour', click: () => void updater.checkNow() }
}

function buildContextMenu(): Menu {
  return Menu.buildFromTemplate([
    { label: 'Rafraîchir', click: () => void monitor.refresh() },
    {
      label: 'Lancer au démarrage de Windows',
      type: 'checkbox',
      enabled: app.isPackaged,
      checked: isAutoStartEnabled(),
      click: (item) => setAutoStart(item.checked)
    },
    { type: 'separator' },
    updateMenuItem(),
    { label: `Version ${app.getVersion()}`, enabled: false },
    { type: 'separator' },
    { label: 'Quitter', click: () => app.quit() }
  ])
}

function registerIpc(): void {
  ipcMain.on(IpcChannel.requestState, (event) => event.sender.send(IpcChannel.state, monitor.getState()))
  ipcMain.on(IpcChannel.refresh, () => void monitor.refresh())
  ipcMain.on(IpcChannel.contentHeight, (_event, height: unknown) => {
    if (typeof height === 'number' && Number.isFinite(height)) panel?.setContentHeight(height)
  })
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.whenReady().then(() => {
    app.setAppUserModelId('dev.qyrn.claude-usage')
    enableAutoStartOnFirstRun()
    registerIpc()
    panel = createPanelWindow(() => void monitor.refreshIfStale())
    tray = new Tray(renderTrayIcon(null, screen.getPrimaryDisplay().scaleFactor))
    tray.setContextMenu(buildContextMenu())
    tray.on('click', (_event, bounds) => panel?.toggle(bounds))
    powerMonitor.on('resume', () => void monitor.refresh())
    monitor.start()
    updater.start()
  })

  app.on('second-instance', () => {
    if (tray) panel?.toggle(tray.getBounds())
  })
}
