import { useOS } from '../../store/os'
import Window from './Window'

export default function WindowManager() {
  const windows = useOS((s) => s.windows)
  return <>{windows.map((w) => <Window key={w.id} win={w} />)}</>
}
