import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  bouquetId: text('bouquet_id').notNull(),
  bouquetName: text('bouquet_name').notNull(),
  price: integer('price_rub').notNull(),
  name: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  date: text('requested_date'),
  wishes: text('wishes').notNull(),
  consentAt: text('consent_at').notNull(),
  createdAt: text('created_at').notNull(),
});
