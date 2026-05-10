CREATE TABLE `scratch_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`body` text NOT NULL,
	`client_id` text,
	`due_at` integer,
	`done_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `scratch_notes_done_idx` ON `scratch_notes` (`done_at`);--> statement-breakpoint
CREATE TABLE `task_dismissals` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`snoozed_until` integer NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `task_dismissals_task_idx` ON `task_dismissals` (`task_id`);--> statement-breakpoint
ALTER TABLE `clients` ADD `goals` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `pain_points` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `current_stack` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `clients` ADD `decision_makers` text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE `clients` ADD `budget_signal` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `timeline_signal` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `source` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `deals` ADD `invoice_number` text;--> statement-breakpoint
ALTER TABLE `deals` ADD `invoice_issued_at` integer;