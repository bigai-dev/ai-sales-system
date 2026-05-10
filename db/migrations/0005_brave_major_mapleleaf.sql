CREATE INDEX `calls_status_idx` ON `calls` (`status`);--> statement-breakpoint
CREATE INDEX `calls_started_at_idx` ON `calls` (`started_at`);--> statement-breakpoint
CREATE INDEX `calls_scheduled_at_idx` ON `calls` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `calls_analyzed_at_idx` ON `calls` (`analyzed_at`);--> statement-breakpoint
CREATE INDEX `deals_closed_at_idx` ON `deals` (`closed_at`);--> statement-breakpoint
CREATE INDEX `deals_invoice_number_idx` ON `deals` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `health_checks_generated_at_idx` ON `health_checks` (`generated_at`);--> statement-breakpoint
CREATE INDEX `proposals_generated_at_idx` ON `proposals` (`generated_at`);