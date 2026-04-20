ALTER TABLE `journal` ADD `is_locked` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `journal` ADD `pin_hash` text;--> statement-breakpoint
ALTER TABLE `journal` ADD `pin_salt` text;--> statement-breakpoint
ALTER TABLE `journal` ADD `biometrics_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `journal_locked_idx` ON `journal` (`is_locked`);