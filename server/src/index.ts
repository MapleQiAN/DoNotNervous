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
import companionRoutes from './routes/companion.js'

const app = new Hono()

const configuredCorsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [
      'http://localhost:5525',
      'http://127.0.0.1:5525',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]
const corsOrigins = Array.from(new Set(configuredCorsOrigins.flatMap((origin) => {
  const loopbackAlias = origin.includes('localhost')
    ? origin.replace('localhost', '127.0.0.1')
    : origin.includes('127.0.0.1')
      ? origin.replace('127.0.0.1', 'localhost')
      : null
  return loopbackAlias ? [origin, loopbackAlias] : [origin]
})))

app.use('*', logger())
app.use('*', cors({
  origin: corsOrigins,
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
app.route('/companion', companionRoutes)

const port = Number(process.env.PORT) || 5052

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`)
})

export default app
