import { motion } from 'framer-motion'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthGuard } from './components/auth/AuthGuard'
import { AppShell } from './components/layout/AppShell'
import { TaskList } from './components/tasks/TaskList'
import { TaskDetailPanel } from './components/tasks/TaskDetailPanel'
import { SettingsDrawer } from './components/layout/SettingsDrawer'
import { MoodPicker } from './components/mood/MoodPicker'
import { Toast } from './components/common/Toast'
import { Mascot } from './components/mascot/Mascot'
import { HomePage } from './components/home/HomePage'
import { RewardShop } from './components/rewards/RewardShop'
import { MoodCalendar } from './components/mood/MoodCalendar'
import { SummaryPage } from './components/summary/SummaryPage'
import { useToast } from './hooks/useToast'
import { useUIStore } from './stores/uiStore'

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
}

function TasksPage() {
  return (
    <div className="dashboard-grid task-route">
      <motion.section className="main-column" {...fadeUp}>
        <TaskList />
      </motion.section>
      <motion.aside className="right-column" {...fadeUp} transition={{ delay: 0.06 }}>
        <TaskDetailPanel />
      </motion.aside>
    </div>
  )
}

function AuthenticatedApp() {
  const isSettingsOpen = useUIStore((s) => s.isSettingsOpen)
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen)
  const { toast, showToast } = useToast()

  return (
    <BrowserRouter>
      <AppShell showToast={showToast}>
        <Routes>
          <Route path="/" element={<HomePage showToast={showToast} />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/rewards" element={<RewardShop showToast={showToast} />} />
          <Route path="/mood" element={<MoodCalendar showToast={showToast} activeView="mood" />} />
          <Route path="/data" element={<SummaryPage showToast={showToast} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        showToast={showToast}
      />
      <MoodPicker showToast={showToast} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      <Mascot />
    </BrowserRouter>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <AuthenticatedApp />
      </AuthGuard>
    </QueryClientProvider>
  )
}

export default App
