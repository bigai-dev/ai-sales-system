CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`health_check_id` text,
	`output` text NOT NULL,
	`cohort_size` integer NOT NULL,
	`per_pax_cents` integer NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`sst_cents` integer NOT NULL,
	`total_cents` integer NOT NULL,
	`venue` text NOT NULL,
	`model_version` text DEFAULT 'deepseek-chat' NOT NULL,
	`generated_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`health_check_id`) REFERENCES `health_checks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `proposals_client_idx` ON `proposals` (`client_id`);