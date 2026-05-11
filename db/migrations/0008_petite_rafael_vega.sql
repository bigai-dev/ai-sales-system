CREATE TABLE `drill_best_responses` (
	`bucket` text PRIMARY KEY NOT NULL,
	`owner_rep_id` text,
	`drill_id` text,
	`call_id` text,
	`rep_response` text NOT NULL,
	`grade` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_rep_id`) REFERENCES `reps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`drill_id`) REFERENCES `drills`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `drills` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_rep_id` text,
	`bucket` text NOT NULL,
	`scenario_prompt` text NOT NULL,
	`rubric` text DEFAULT '[]' NOT NULL,
	`rep_response` text NOT NULL,
	`grade` integer NOT NULL,
	`feedback` text NOT NULL,
	`did_exceed_best` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_rep_id`) REFERENCES `reps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `drills_bucket_idx` ON `drills` (`bucket`);--> statement-breakpoint
CREATE INDEX `drills_created_idx` ON `drills` (`created_at`);--> statement-breakpoint
ALTER TABLE `calls` ADD `dry_run` text;