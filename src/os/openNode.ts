import { VNode } from './vfs'
import { printResume } from './print'
import { useOS } from '../store/os'

// Shared "open this node" dispatcher used by the desktop and folder windows.
export function openVNode(node: VNode, segs: string[]) {
  const s = useOS.getState()
  if (node.type === 'dir') s.openWindow(segs)
  else if (node.type === 'game') s.setActiveGame(node.game || node.name)
  else if (node.type === 'link' && node.url) window.open(node.url, '_blank')
  else if (node.type === 'app') {
    if (node.name === 'settings') s.setView('settings')
    else if (node.name === 'terminal') s.setView('terminal')
    else s.openAppWindow(node.name, node.label || node.name, node.icon)
  }
  else if (node.type === 'file') { if (node.name === 'resume.pdf') printResume(); else s.openTextWindow(node) }
}
