import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, primaryKey, date } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  type: varchar('type', { length: 20 }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  difficulty: varchar('difficulty', { length: 20 }).notNull().default('easy'),
  category: text('category').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const pointLedger = pgTable('point_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  type: varchar('type', { length: 30 }).notNull(),
  reason: text('reason').notNull().default(''),
  taskId: uuid('task_id'),
  streakLength: integer('streak_length').notNull().default(0),
  multiplier: integer('multiplier').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const streakRecords = pgTable('streak_records', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  completedTaskIds: jsonb('completed_task_ids').notNull().$type<string[]>().default([]),
  freezeUsed: boolean('freeze_used').notNull().default(false),
  freezeCountRemaining: integer('freeze_count_remaining').notNull().default(0),
  recoveredFrom: boolean('recovered_from').notNull().default(false),
  recoveryTaskId: uuid('recovery_task_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.date] }),
])

export const moodEntries = pgTable('mood_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  emoji: varchar('emoji', { length: 10 }).notNull(),
  label: text('label').notNull().default(''),
  journal: text('journal').notNull().default(''),
  taskId: uuid('task_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const rewards = pgTable('rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  pointCost: integer('point_cost').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const redemptions = pgTable('redemptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rewardId: uuid('reward_id').notNull(),
  rewardName: text('reward_name').notNull(),
  pointsSpent: integer('points_spent').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const dailySummaries = pgTable('daily_summaries', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  id: uuid('id').defaultRandom(),
  date: date('date').notNull(),
  tasksCompleted: integer('tasks_completed').notNull().default(0),
  tasksCreated: integer('tasks_created').notNull().default(0),
  pointsEarned: integer('points_earned').notNull().default(0),
  pointsSpent: integer('points_spent').notNull().default(0),
  dominantMood: varchar('dominant_mood', { length: 10 }),
  dominantMoodScore: integer('dominant_mood_score').notNull().default(0),
  taskIds: jsonb('task_ids').notNull().$type<string[]>().default([]),
  moodEntryIds: jsonb('mood_entry_ids').notNull().$type<string[]>().default([]),
  ledgerEntryIds: jsonb('ledger_entry_ids').notNull().$type<string[]>().default([]),
  redemptionIds: jsonb('redemption_ids').notNull().$type<string[]>().default([]),
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.date] }),
])

export const weeklySummaries = pgTable('weekly_summaries', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  id: uuid('id').defaultRandom(),
  weekStart: date('week_start').notNull(),
  weekEnd: date('week_end').notNull(),
  totalTasksCompleted: integer('total_tasks_completed').notNull().default(0),
  totalTasksCreated: integer('total_tasks_created').notNull().default(0),
  totalPointsEarned: integer('total_points_earned').notNull().default(0),
  totalPointsSpent: integer('total_points_spent').notNull().default(0),
  avgMoodScore: integer('avg_mood_score').notNull().default(0),
  streakDays: integer('streak_days').notNull().default(0),
  completionRate: integer('completion_rate').notNull().default(0),
  bestDayDate: date('best_day_date'),
  bestDayScore: integer('best_day_score').notNull().default(0),
  bestDayTaskCount: integer('best_day_task_count').notNull().default(0),
  userBestDayOverride: date('user_best_day_override'),
  dailyBreakdown: jsonb('daily_breakdown').notNull().$type<Array<{
    date: string; tasksCompleted: number; pointsEarned: number; moodScore: number; compositeScore: number
  }>>().default([]),
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.weekStart] }),
])
