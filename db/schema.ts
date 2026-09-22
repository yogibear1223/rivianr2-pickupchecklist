import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
export const inspections = sqliteTable('inspections', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  vin: text('vin').notNull(),
  last4: text('last4').notNull(),
  document: text('document').notNull(),
  revision: integer('revision').notNull().default(1),
  mutationId: text('mutation_id').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [uniqueIndex('inspections_owner_vin').on(table.userId,table.vin),index('inspections_owner_suffix').on(table.userId,table.last4)]);
