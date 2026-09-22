import { usageLevelFor, type UsageApi, type UsageLimit, type UsageState } from '../../shared/usage'

declare global {
  interface Window {
    usageApi: UsageApi
  }
}

function requireElement<T extends HTMLElement>(id: string, type: new () => T): T {
  const element = document.getElementById(id)
  if (!(element instanceof type)) throw new Error(`Missing element #${id}`)
  return element
}

const panel = requireElement('panel', HTMLElement)
const limitList = requireElement('limit-list', HTMLUListElement)
const errorMessage = requireElement('error-message', HTMLParagraphElement)
const refreshButton = requireElement('refresh-button', HTMLButtonElement)
const extraSpend = requireElement('extra-spend', HTMLSpanElement)
const updatedAt = requireElement('updated-at', HTMLSpanElement)

const clockFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const weekdayFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit'
})
const oneMinuteMs = 60_000
const oneDayMs = 24 * 60 * oneMinuteMs

let currentState: UsageState | null = null

function describeReset(resetsAt: string | null): string {
  if (!resetsAt) return 'pas de reset prévu'
  const resetDate = new Date(resetsAt)
  const remainingMs = resetDate.getTime() - Date.now()
  if (remainingMs <= 0) return 'reset imminent'
  if (remainingMs >= oneDayMs) return `reset ${weekdayFormat.format(resetDate)}`
  const totalMinutes = Math.ceil(remainingMs / oneMinuteMs)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = String(totalMinutes % 60).padStart(2, '0')
  const remaining = hours > 0 ? `${hours} h ${minutes}` : `${totalMinutes} min`
  return `reset dans ${remaining}, à ${clockFormat.format(resetDate)}`
}

function describeUpdatedAt(fetchedAt: string): string {
  const elapsedMinutes = Math.floor((Date.now() - new Date(fetchedAt).getTime()) / oneMinuteMs)
  return elapsedMinutes < 1 ? "à l'instant" : `il y a ${elapsedMinutes} min`
}

function createElement(tag: string, className: string, text = ''): HTMLElement {
  const element = document.createElement(tag)
  element.className = className
  element.textContent = text
  return element
}

function renderLimit(limit: UsageLimit): HTMLLIElement {
  const item = document.createElement('li')
  item.dataset.level = usageLevelFor(limit.percent)

  const heading = createElement('div', 'limit-heading')
  heading.append(
    createElement('span', 'limit-label', limit.label),
    createElement('span', 'limit-percent', `${Math.round(limit.percent)} %`)
  )

  const track = createElement('div', 'limit-track')
  const fill = createElement('div', 'limit-fill')
  fill.style.width = `${Math.min(100, Math.max(0, limit.percent))}%`
  track.append(fill)

  item.append(heading, track, createElement('div', 'limit-reset', describeReset(limit.resetsAt)))
  return item
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount)
}

function render(): void {
  if (!currentState) return
  const { snapshot, errorMessage: error, isRefreshing } = currentState

  limitList.replaceChildren(...(snapshot?.limits.map(renderLimit) ?? []))
  errorMessage.hidden = !error
  errorMessage.textContent = error ?? ''
  refreshButton.disabled = isRefreshing
  refreshButton.textContent = isRefreshing ? 'Chargement...' : 'Rafraîchir'

  const spend = snapshot?.extraSpend
  extraSpend.textContent = spend ? `Crédits extra : ${formatMoney(spend.amount, spend.currency)}` : ''
  updatedAt.textContent = snapshot ? `Mis à jour ${describeUpdatedAt(snapshot.fetchedAt)}` : ''

  window.usageApi.reportContentHeight(panel.getBoundingClientRect().height)
}

window.usageApi.onState((state) => {
  currentState = state
  render()
})
refreshButton.addEventListener('click', () => window.usageApi.refresh())
setInterval(render, 30_000)
window.usageApi.requestState()
