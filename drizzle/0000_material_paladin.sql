CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`bouquet_id` text NOT NULL,
	`bouquet_name` text NOT NULL,
	`price_rub` integer NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`requested_date` text,
	`wishes` text NOT NULL,
	`consent_at` text NOT NULL,
	`created_at` text NOT NULL
);
