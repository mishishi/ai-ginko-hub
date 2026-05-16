import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  tags: text('tags').notNull(), // JSON array string
  url: text('url').notNull(),
  thumbnail: text('thumbnail'), // R2 URL
  createdAt: text('created_at').notNull(), // ISO date string
  featured: integer('featured', { mode: 'boolean' }).default(false),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogImage: text('og_image'),
  viewCount: integer('view_count').default(0),
  createdAtTs: integer('created_at_ts'), // Unix timestamp for sorting
  updatedAt: integer('updated_at'),
});

export const admin = sqliteTable('admin', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
});

export const favorites = sqliteTable('favorites', {
  id: text('id').primaryKey(), // UUID
  projectId: text('project_id').notNull().references(() => projects.id),
  userId: text('user_id').notNull(), // Clerk user.id
  createdAt: integer('created_at_ts').notNull(), // Unix timestamp
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
