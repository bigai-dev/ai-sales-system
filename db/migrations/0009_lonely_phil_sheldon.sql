CREATE TABLE `plays` (
	`id` text PRIMARY KEY NOT NULL,
	`call_id` text NOT NULL,
	`owner_rep_id` text,
	`bucket` text NOT NULL,
	`scenario` text NOT NULL,
	`rep_response_excerpt` text NOT NULL,
	`outcome` text NOT NULL,
	`source` text NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_rep_id`) REFERENCES `reps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `plays_bucket_idx` ON `plays` (`bucket`);--> statement-breakpoint
CREATE INDEX `plays_call_idx` ON `plays` (`call_id`);--> statement-breakpoint
CREATE INDEX `plays_pinned_idx` ON `plays` (`pinned`);