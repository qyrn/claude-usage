import { contextBridge, ipcRenderer } from 'electron'
import { IpcChannel, type UsageApi, type UsageState } from '../shared/usage'

const usageApi: UsageApi = {
  onState: (listener) => {
    ipcRenderer.on(IpcChannel.state, (_event, state: UsageState) => listener(state))
  },
  requestState: () => ipcRenderer.send(IpcChannel.requestState),
  refresh: () => ipcRenderer.send(IpcChannel.refresh),
  reportContentHeight: (height) => ipcRenderer.send(IpcChannel.contentHeight, height)
}

contextBridge.exposeInMainWorld('usageApi', usageApi)
