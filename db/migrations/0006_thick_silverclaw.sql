CREATE TABLE `invoice_counters` (
	`year` integer PRIMARY KEY NOT NULL,
	`last_seq` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `coaching_opportunities` ADD `owner_rep_id` text REFERENCES reps(id);--> statement-breakpoint
ALTER TABLE `coaching_scores` ADD `owner_rep_id` text REFERENCES reps(id);--> statement-breakpoint
ALTER TABLE `coaching_wins` ADD `owner_rep_id` text REFERENCES reps(id);--> statement-breakpoint
ALTER TABLE `scratch_notes` ADD `owner_rep_id` text REFERENCES reps(id);--> statement-breakpoint
ALTER TABLE `task_dismissals` ADD `owner_rep_id` text REFERENCES reps(id);