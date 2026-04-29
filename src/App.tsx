import { AppShell } from './components/layout/AppShell'
import { TaskInput } from './components/tasks/TaskInput'
import { TaskList } from './components/tasks/TaskList'
import { SettingsDrawer } from './components/layout/SettingsDrawer'
import { Toast } from './components/common/Toast'
import { useToast } from './hooks/useToast'
import { useUIStore } from './stores/uiStore'

function App() {
  const isSettingsOpen = useUIStore((s) => s.isSettingsOpen)
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen)
  const { toast, showToast } = useToast()

  return (
    <>
      <AppShell>
        <TaskInput />
        <TaskList />
      </AppShell>
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        showToast={showToast}
      />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </>
  )
}

export default App
