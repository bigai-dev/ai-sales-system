CREATE TABLE `call_metrics` (
	`call_id` text PRIMARY KEY NOT NULL,
	`owner_rep_id` text,
	`stage_progression` integer DEFAULT 0 NOT NULL,
	`briefing_adherence` integer,
	`discovery_coverage` integer,
	`objection_preparedness` integer,
	`talk_pct` integer,
	`computed_at` integer NOT NULL,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_rep_id`) REFERENCES `reps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `call_metrics_computed_idx` ON `call_metrics` (`computed_at`);--> statement-breakpoint
ALTER TABLE `coaching_opportunities` ADD `run_id` text;--> statement-breakpoint
CREATE INDEX `coaching_opps_run_idx` ON `coaching_opportunities` (`run_id`,`generated_at`);--> statement-breakpoint
ALTER TABLE `coaching_scores` ADD `run_id` text;--> statement-breakpoint
CREATE INDEX `coaching_scores_run_idx` ON `coaching_scores` (`run_id`,`generated_at`);--> statement-breakpoint
ALTER TABLE `coaching_wins` ADD `run_id` text;--> statement-breakpoint
CREATE INDEX `coaching_wins_run_idx` ON `coaching_wins` (`run_id`,`generated_at`);--> statement-breakpoint
UPDATE `coaching_scores` SET `run_id` = 'legacy-pre-runid' WHERE `run_id` IS NULL;--> statement-breakpoint
UPDATE `coaching_opportunities` SET `run_id` = 'legacy-pre-runid' WHERE `run_id` IS NULL;--> statement-breakpoint
UPDATE `coaching_wins` SET `run_id` = 'legacy-pre-runid' WHERE `run_id` IS NULL;