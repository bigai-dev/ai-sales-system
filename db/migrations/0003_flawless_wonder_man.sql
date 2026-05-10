DROP INDEX "call_tips_call_idx";--> statement-breakpoint
DROP INDEX "call_turns_call_idx";--> statement-breakpoint
DROP INDEX "calls_deal_idx";--> statement-breakpoint
DROP INDEX "calls_client_idx";--> statement-breakpoint
DROP INDEX "clients_name_unique";--> statement-breakpoint
DROP INDEX "clients_stage_idx";--> statement-breakpoint
DROP INDEX "deals_stage_idx";--> statement-breakpoint
DROP INDEX "deals_client_idx";--> statement-breakpoint
DROP INDEX "health_checks_client_idx";--> statement-breakpoint
DROP INDEX "proposals_client_idx";--> statement-breakpoint
DROP INDEX "reps_initials_unique";--> statement-breakpoint
DROP INDEX "reps_email_unique";--> statement-breakpoint
ALTER TABLE `calls` ALTER COLUMN "status" TO "status" text NOT NULL DEFAULT 'planned';--> statement-breakpoint
CREATE INDEX `call_tips_call_idx` ON `call_tips` (`call_id`);--> statement-breakpoint
CREATE INDEX `call_turns_call_idx` ON `call_turns` (`call_id`);--> statement-breakpoint
CREATE INDEX `calls_deal_idx` ON `calls` (`deal_id`);--> statement-breakpoint
CREATE INDEX `calls_client_idx` ON `calls` (`client_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `clients_name_unique` ON `clients` (`name`);--> statement-breakpoint
CREATE INDEX `clients_stage_idx` ON `clients` (`stage`);--> statement-breakpoint
CREATE INDEX `deals_stage_idx` ON `deals` (`stage`);--> statement-breakpoint
CREATE INDEX `deals_client_idx` ON `deals` (`client_id`);--> statement-breakpoint
CREATE INDEX `health_checks_client_idx` ON `health_checks` (`client_id`);--> statement-breakpoint
CREATE INDEX `proposals_client_idx` ON `proposals` (`client_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `reps_initials_unique` ON `reps` (`initials`);--> statement-breakpoint
CREATE UNIQUE INDEX `reps_email_unique` ON `reps` (`email`);--> statement-breakpoint
ALTER TABLE `calls` ADD `scheduled_at` integer;--> statement-breakpoint
ALTER TABLE `calls` ADD `briefing` text;--> statement-breakpoint
ALTER TABLE `calls` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `calls` ADD `debrief` text;--> statement-breakpoint
ALTER TABLE `calls` ADD `outcome` text;--> statement-breakpoint
ALTER TABLE `calls` ADD `next_step` text;--> statement-breakpoint
ALTER TABLE `calls` ADD `suggested_stage` text;--> statement-breakpoint
ALTER TABLE `calls` ADD `analyzed_at` integer;