CREATE TABLE `attachment` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`type` text NOT NULL,
	`uri` text NOT NULL,
	`mime_type` text,
	`file_name` text,
	`size_bytes` integer,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entry`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attachment_entry_idx` ON `attachment` (`entry_id`);--> statement-breakpoint
CREATE TABLE `emotion_record` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`category` text NOT NULL,
	`intensity` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entry`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `emotion_entry_idx` ON `emotion_record` (`entry_id`);--> statement-breakpoint
CREATE INDEX `emotion_category_idx` ON `emotion_record` (`category`);--> statement-breakpoint
CREATE INDEX `emotion_entry_intensity_idx` ON `emotion_record` (`entry_id`,`intensity`);--> statement-breakpoint
CREATE TABLE `entry` (
	`id` text PRIMARY KEY NOT NULL,
	`journal_id` text NOT NULL,
	`content_html` text DEFAULT '' NOT NULL,
	`content_text` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`journal_id`) REFERENCES `journal`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `entry_journal_idx` ON `entry` (`journal_id`);--> statement-breakpoint
CREATE INDEX `entry_journal_created_idx` ON `entry` (`journal_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `entry_created_idx` ON `entry` (`created_at`);--> statement-breakpoint
CREATE TABLE `journal` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `journal_user_idx` ON `journal` (`user_id`);--> statement-breakpoint
CREATE INDEX `journal_user_order_idx` ON `journal` (`user_id`,`display_order`);--> statement-breakpoint
CREATE UNIQUE INDEX `journal_user_name_idx` ON `journal` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `location` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`name` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entry`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `location_entry_idx` ON `location` (`entry_id`);--> statement-breakpoint
CREATE TABLE `reminder` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`is_enabled` integer DEFAULT false NOT NULL,
	`hour` integer NOT NULL,
	`minute` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reminder_user_idx` ON `reminder` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`has_completed_onboarding` integer DEFAULT false NOT NULL,
	`last_active_journal_id` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`last_active_journal_id`) REFERENCES `journal`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_user_idx` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`supabase_id` text,
	`email` text,
	`display_name` text,
	`is_guest` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_supabase_id_unique` ON `user` (`supabase_id`);