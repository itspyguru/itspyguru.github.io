import Calculator from './Calculator'
import Calendar from './Calendar'
import Camera from './Camera'
import Clock from './Clock'
import Notes from './Notes'
import Gallery from './Gallery'
import Radio from './Radio'

export interface AppMeta { id: string; label: string; icon: string; w: number; Component: React.FC }
export const APPS: Record<string, AppMeta> = {
  calculator: { id: 'calculator', label: 'Calculator', icon: 'calculate', w: 286, Component: Calculator },
  calendar: { id: 'calendar', label: 'Calendar', icon: 'calendar_month', w: 312, Component: Calendar },
  camera: { id: 'camera', label: 'Camera', icon: 'photo_camera', w: 364, Component: Camera },
  gallery: { id: 'gallery', label: 'Gallery', icon: 'photo_library', w: 404, Component: Gallery },
  radio: { id: 'radio', label: 'Radio', icon: 'radio', w: 364, Component: Radio },
  clock: { id: 'clock', label: 'Clock', icon: 'schedule', w: 300, Component: Clock },
  notes: { id: 'notes', label: 'Notes', icon: 'sticky_note_2', w: 344, Component: Notes },
}
