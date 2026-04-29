import { AppShell } from './components/layout/AppShell'
import { EmptyState } from './components/common/EmptyState'

function App() {
  return (
    <AppShell>
      <EmptyState
        heading="Nothing here yet"
        body="Add your first task to get started. One small step counts."
      />
    </AppShell>
  )
}

export default App
