import { useOS } from '../store/os'

export default function Toast() {
  const toast = useOS((s) => s.toast)
  return (
    <div id="toast" className={'bg-surface-container-highest border border-primary-fixed-dim/40 px-4 py-2 text-data-label text-primary-fixed-dim ' + (toast ? 'show' : '')}>
      {toast}
    </div>
  )
}
