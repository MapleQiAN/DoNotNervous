CREATE TABLE IF NOT EXISTS "companion_profiles" (
  "user_id" uuid PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "display_name" text DEFAULT '圆圆' NOT NULL,
  "level" integer DEFAULT 1 NOT NULL,
  "experience" integer DEFAULT 0 NOT NULL,
  "energy" integer DEFAULT 80 NOT NULL,
  "mood" varchar(30) DEFAULT 'normal' NOT NULL,
  "active_cosmetic_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cosmetic_unlocks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "cosmetic_id" varchar(80) NOT NULL,
  "name" text NOT NULL,
  "slot" varchar(30) NOT NULL,
  "point_cost" integer DEFAULT 0 NOT NULL,
  "equipped" boolean DEFAULT false NOT NULL,
  "unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "cosmetic_unlocks_user_cosmetic_idx"
  ON "cosmetic_unlocks" ("user_id", "cosmetic_id");

CREATE TABLE IF NOT EXISTS "reminder_preferences" (
  "user_id" uuid PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "enabled" boolean DEFAULT false NOT NULL,
  "hour" integer DEFAULT 20 NOT NULL,
  "minute" integer DEFAULT 30 NOT NULL,
  "message" text DEFAULT '如果愿意，可以回来看看今天的小进步。' NOT NULL,
  "timezone" varchar(80) DEFAULT 'Asia/Shanghai' NOT NULL,
  "last_scheduled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sync_states" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "device_id" varchar(128) NOT NULL,
  "last_pulled_at" timestamp with time zone,
  "last_pushed_at" timestamp with time zone,
  "pending_local_change_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("user_id", "device_id")
);
