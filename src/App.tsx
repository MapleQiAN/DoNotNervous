import { AppShell } from './components/layout/AppShell'
import { TaskInput } from './components/tasks/TaskInput'
import { TaskList } from './components/tasks/TaskList'

function App() {
  return (
    <AppShell>
      <TaskInput />
      <TaskList />
    </AppShell>
  )
}

export default App
