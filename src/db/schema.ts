import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/* ---------- content ---------- */

// Every text field has an optional English twin (…En). Missing English falls back to Vietnamese.
export const tools = pgTable('tools', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  tagline: text('tagline').notNull().default(''),
  taglineEn: text('tagline_en'),
  description: text('description').notNull().default(''), // Markdown
  descriptionEn: text('description_en'),
  iconUrl: text('icon_url'),
  platform: text('platform'),
  downloadUrl: text('download_url'),
  githubUrl: text('github_url'),
  docsUrl: text('docs_url'),
  status: text('status', { enum: ['dev', 'released'] }).notNull().default('dev'),
  sortOrder: integer('sort_order').notNull().default(0),
  published: boolean('published').notNull().default(false),
  isSample: boolean('is_sample').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  titleEn: text('title_en'),
  description: text('description').notNull().default(''), // Markdown
  descriptionEn: text('description_en'),
  youtubeId: text('youtube_id'), // empty for sample videos
  toolId: integer('tool_id').references(() => tools.id, { onDelete: 'set null' }),
  duration: text('duration'), // e.g. "4:12"
  vertical: boolean('vertical').notNull().default(false),
  thumbnailUrl: text('thumbnail_url'),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
  published: boolean('published').notNull().default(false),
  isSample: boolean('is_sample').notNull().default(false),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  titleEn: text('title_en'),
  description: text('description').notNull().default(''),
  descriptionEn: text('description_en'),
  body: text('body').notNull().default(''), // Markdown
  bodyEn: text('body_en'),
  coverUrl: text('cover_url'),
  tags: text('tags').array().notNull().default([]),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  published: boolean('published').notNull().default(false),
  isSample: boolean('is_sample').notNull().default(false),
});

/* ---------- people (Auth.js tables) ---------- */

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date', withTimezone: true }),
  image: text('image'),
  role: text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
  banned: boolean('banned').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ---------- member activity ---------- */

export type TargetType = 'video' | 'post';

export const comments = pgTable(
  'comments',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    targetType: text('target_type', { enum: ['video', 'post'] }).notNull(),
    targetId: integer('target_id').notNull(),
    parentId: integer('parent_id'), // one level of replies
    body: text('body').notNull(), // plain text, never HTML
    hidden: boolean('hidden').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    editedAt: timestamp('edited_at', { withTimezone: true }),
  },
  (t) => [index('comments_target_idx').on(t.targetType, t.targetId), index('comments_user_idx').on(t.userId)],
);

export const likes = pgTable(
  'likes',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    targetType: text('target_type', { enum: ['video', 'post'] }).notNull(),
    targetId: integer('target_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.targetType, t.targetId] })],
);

export const saves = pgTable(
  'saves',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    targetType: text('target_type', { enum: ['video', 'post'] }).notNull(),
    targetId: integer('target_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.targetType, t.targetId] })],
);

// scope is "all" (the whole site) or "tool:<id>"
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    scope: text('scope').notNull(),
    unsubscribeToken: text('unsubscribe_token').notNull().$defaultFn(() => crypto.randomUUID().replaceAll('-', '')),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('subscriptions_user_scope_idx').on(t.userId, t.scope),
    uniqueIndex('subscriptions_token_idx').on(t.unsubscribeToken),
  ],
);

// Remembers which item already had its announcement email, so nobody gets it twice
export const notificationsSent = pgTable(
  'notifications_sent',
  {
    id: serial('id').primaryKey(),
    kind: text('kind', { enum: ['video', 'tool'] }).notNull(),
    targetId: integer('target_id').notNull(),
    recipients: integer('recipients').notNull().default(0),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('notifications_sent_target_idx').on(t.kind, t.targetId)],
);
