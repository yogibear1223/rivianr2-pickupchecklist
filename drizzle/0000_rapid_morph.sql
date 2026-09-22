CREATE TABLE `inspections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`vin` text NOT NULL,
	`last4` text NOT NULL,
	`document` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`mutation_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inspections_owner_vin` ON `inspections` (`user_id`,`vin`);--> statement-breakpoint
CREATE INDEX `inspections_owner_suffix` ON `inspections` (`user_id`,`last4`);