import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import authRoutes from './routes/auth.js'
import taskRoutes from './routes/tasks.js'
import moodRoutes from './routes/mood.js'
import streakRoutes from './routes/streaks.js'
import rewardRoutes from './routes/rewards.js'
import pointRoutes from './routes/points.js'
import summaryRoutes from './routes/summaries.js'
import syncRoutes from './routes/sync.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5525',
  credentials: true,
}))

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.route('/auth', authRoutes)
app.route('/tasks', taskRoutes)
app.route('/mood', moodRoutes)
app.route('/streaks', streakRoutes)
app.route('/rewards', rewardRoutes)
app.route('/points', pointRoutes)
app.route('/summaries', summaryRoutes)
app.route('/sync', syncRoutes)

const port = Number(process.env.PORT) || 5052

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
})

export default app
