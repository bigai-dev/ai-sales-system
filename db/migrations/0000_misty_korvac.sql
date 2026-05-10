CREATE TABLE `call_tips` (
	`id` text PRIMARY KEY NOT NULL,
	`call_id` text NOT NULL,
	`turn_idx` integer,
	`kind` text DEFAULT 'TIP' NOT NULL,
	`text` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `call_tips_call_idx` ON `call_tips` (`call_id`);--> statement-breakpoint
CREATE TABLE `call_turns` (
	`id` text PRIMARY KEY NOT NULL,
	`call_id` text NOT NULL,
	`idx` integer NOT NULL,
	`who` text NOT NULL,
	`speaker_label` text,
	`text` text NOT NULL,
	`ts` integer NOT NULL,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `call_turns_call_idx` ON `call_turns` (`call_id`);--> statement-breakpoint
CREATE TABLE `calls` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text,
	`deal_id` text,
	`rep_id` text,
	`title` text,
	`status` text DEFAULT 'live' NOT NULL,
	`script_template_id` text,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`talk_pct` integer,
	`questions_asked` integer DEFAULT 0 NOT NULL,
	`sentiment` integer DEFAULT 0 NOT NULL,
	`stage_hint` text,
	`summary` text,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`rep_id`) REFERENCES `reps`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`script_template_id`) REFERENCES `script_templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `calls_deal_idx` ON `calls` (`deal_id`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`initials` text NOT NULL,
	`contact_name` text NOT NULL,
	`contact_role` text,
	`industry` text,
	`size` text,
	`employees` integer,
	`arr_cents` integer DEFAULT 0 NOT NULL,
	`stage` text DEFAULT 'Lead' NOT NULL,
	`health` integer DEFAULT 50 NOT NULL,
	`products` text DEFAULT '[]',
	`gradient` text,
	`owner_rep_id` text,
	`last_activity_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_rep_id`) REFERENCES `reps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clients_name_unique` ON `clients` (`name`);--> statement-breakpoint
CREATE INDEX `clients_stage_idx` ON `clients` (`stage`);--> statement-breakpoint
CREATE TABLE `coaching_opportunities` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`impact_text` text NOT NULL,
	`impact_tone` text DEFAULT 'warn' NOT NULL,
	`sort_idx` integer DEFAULT 0 NOT NULL,
	`generated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coaching_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`score` integer NOT NULL,
	`sort_idx` integer DEFAULT 0 NOT NULL,
	`generated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coaching_wins` (
	`id` text PRIMARY KEY NOT NULL,
	`prefix` text NOT NULL,
	`num` text,
	`suffix` text,
	`sort_idx` integer DEFAULT 0 NOT NULL,
	`generated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `deal_insight_cache` (
	`deal_id` text PRIMARY KEY NOT NULL,
	`input_hash` text NOT NULL,
	`text` text NOT NULL,
	`generated_at` integer NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`owner_rep_id` text,
	`title` text,
	`stage` text DEFAULT 'S' NOT NULL,
	`value_cents` integer DEFAULT 0 NOT NULL,
	`probability` integer DEFAULT 0 NOT NULL,
	`hot` integer DEFAULT false,
	`insight` text,
	`tags` text DEFAULT '[]',
	`next_step` text,
	`next_step_at` integer,
	`last_activity` text,
	`last_activity_at` integer,
	`days_in_stage_starts_at` integer NOT NULL,
	`closed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_rep_id`) REFERENCES `reps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `deals_stage_idx` ON `deals` (`stage`);--> statement-breakpoint
CREATE INDEX `deals_client_idx` ON `deals` (`client_id`);--> statement-breakpoint
CREATE TABLE `health_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`health_check_id` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`impact` text NOT NULL,
	`sort_idx` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`health_check_id`) REFERENCES `health_checks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `health_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`overall_score` integer NOT NULL,
	`status` text NOT NULL,
	`peers_score` integer,
	`summary` text NOT NULL,
	`callouts` text DEFAULT '[]',
	`related` text DEFAULT '[]',
	`meta` text,
	`model_version` text,
	`generated_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `health_checks_client_idx` ON `health_checks` (`client_id`);--> statement-breakpoint
CREATE TABLE `health_dimensions` (
	`id` text PRIMARY KEY NOT NULL,
	`health_check_id` text NOT NULL,
	`name` text NOT NULL,
	`score` integer NOT NULL,
	`status` text NOT NULL,
	`summary` text NOT NULL,
	`metrics` text DEFAULT '[]',
	`sort_idx` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`health_check_id`) REFERENCES `health_checks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `health_risks` (
	`id` text PRIMARY KEY NOT NULL,
	`health_check_id` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`tone` text DEFAULT 'warn' NOT NULL,
	`tag` text NOT NULL,
	`sort_idx` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`health_check_id`) REFERENCES `health_checks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reps` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`initials` text NOT NULL,
	`email` text,
	`gradient` text,
	`is_primary` integer DEFAULT false,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reps_initials_unique` ON `reps` (`initials`);--> statement-breakpoint
CREATE UNIQUE INDEX `reps_email_unique` ON `reps` (`email`);--> statement-breakpoint
CREATE TABLE `script_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sections` text NOT NULL,
	`is_default` integer DEFAULT false,
	`created_at` integer NOT NULL
);
