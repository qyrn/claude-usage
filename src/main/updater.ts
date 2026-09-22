import { app, Notification } from 'electron'
import { autoUpdater } from 'electron-updater'

const periodicCheckIntervalMs = 6 * 60 * 60_000

export interface Updater {
  start: () => void
  checkNow: () => Promise<void>
  installNow: () => void
  getReadyVersion: () => string | null
}

function notify(title: string, body: string, onClick?: () => void): void {
  const notification = new Notification({ title, body })
  if (onClick) notification.on('click', onClick)
  notification.show()
}

export function createUpdater(onReadyVersionChange: () => void): Updater {
  let readyVersion: string | null = null

  function installNow(): void {
    autoUpdater.quitAndInstall()
  }

  autoUpdater.on('update-downloaded', (info) => {
    readyVersion = info.version
    onReadyVersionChange()
    notify(
      `Claude Usage ${info.version} est prête`,
      "Clique ici pour redémarrer et l'installer, ou elle s'installera à la prochaine fermeture.",
      installNow
    )
  })

  autoUpdater.on('error', () => undefined)

  async function checkQuietly(): Promise<void> {
    await autoUpdater.checkForUpdates().catch(() => null)
  }

  return {
    start: () => {
      if (!app.isPackaged) return
      void checkQuietly()
      setInterval(() => void checkQuietly(), periodicCheckIntervalMs)
    },
    checkNow: async () => {
      if (!app.isPackaged) {
        notify('Mises à jour', 'Les mises à jour ne sont vérifiées que sur la version installée.')
        return
      }
      try {
        const result = await autoUpdater.checkForUpdates()
        if (result?.isUpdateAvailable) {
          notify('Mise à jour trouvée', `Téléchargement de la version ${result.updateInfo.version}...`)
        } else {
          notify('Mises à jour', `Claude Usage ${app.getVersion()} est à jour.`)
        }
      } catch {
        notify('Mises à jour', 'Impossible de vérifier les mises à jour. Réessaie plus tard.')
      }
    },
    installNow,
    getReadyVersion: () => readyVersion
  }
}
