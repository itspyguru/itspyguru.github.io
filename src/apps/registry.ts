import Calculator from './Calculator'
import Calendar from './Calendar'
import Camera from './Camera'
import Clock from './Clock'
import Notes from './Notes'
import Gallery from './Gallery'
import Radio from './Radio'
import About from './About'
import Network from './Network'
import Logs from './Logs'
import FileManager from './FileManager'
import Paint from './Paint'
import Weather from './Weather'
import Maps from './Maps'

export interface AppMeta { id: string; label: string; icon: string; w: number; Component: React.FC }
export const APPS: Record<string, AppMeta> = {
  calculator: { id: 'calculator', label: 'Calculator', icon: 'calculate', w: 286, Component: Calculator },
  calendar: { id: 'calendar', label: 'Calendar', icon: 'calendar_month', w: 312, Component: Calendar },
  camera: { id: 'camera', label: 'Camera', icon: 'photo_camera', w: 364, Component: Camera },
  gallery: { id: 'gallery', label: 'Gallery', icon: 'photo_library', w: 404, Component: Gallery },
  radio: { id: 'radio', label: 'Radio', icon: 'radio', w: 364, Component: Radio },
  files: { id: 'files', label: 'Files', icon: 'folder_open', w: 460, Component: FileManager },
  paint: { id: 'paint', label: 'Paint', icon: 'brush', w: 360, Component: Paint },
  weather: { id: 'weather', label: 'Weather', icon: 'partly_cloudy_day', w: 300, Component: Weather },
  maps: { id: 'maps', label: 'Maps', icon: 'map', w: 424, Component: Maps },
  clock: { id: 'clock', label: 'Clock', icon: 'schedule', w: 300, Component: Clock },
  notes: { id: 'notes', label: 'Notes', icon: 'sticky_note_2', w: 344, Component: Notes },
  about: { id: 'about', label: 'About', icon: 'info', w: 360, Component: About },
  network: { id: 'network', label: 'Network', icon: 'lan', w: 360, Component: Network },
  logs: { id: 'logs', label: 'Logs', icon: 'receipt_long', w: 384, Component: Logs },
}
