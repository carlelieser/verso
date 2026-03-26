CREATE TABLE `journal` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT 'book-open' NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `journal_order_idx` ON `journal` (`display_order`);
--> statement-breakpoint
CREATE UNIQUE INDEX `journal_name_idx` ON `journal` (`name`);
--> statement-breakpoint
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
CREATE INDEX `entry_journal_idx` ON `entry` (`journal_id`);
--> statement-breakpoint
CREATE INDEX `entry_journal_created_idx` ON `entry` (`journal_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `entry_created_idx` ON `entry` (`created_at`);
--> statement-breakpoint
CREATE TABLE `emotion_record` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`category` text NOT NULL,
	`intensity` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entry`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `emotion_entry_idx` ON `emotion_record` (`entry_id`);
--> statement-breakpoint
CREATE INDEX `emotion_category_idx` ON `emotion_record` (`category`);
--> statement-breakpoint
CREATE INDEX `emotion_entry_intensity_idx` ON `emotion_record` (`entry_id`,`intensity`);
--> statement-breakpoint
CREATE TABLE `attachment` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`type` text NOT NULL,
	`data` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entry`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attachment_entry_idx` ON `attachment` (`entry_id`);
--> statement-breakpoint
CREATE TABLE `weather_record` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`temperature` real NOT NULL,
	`condition` text NOT NULL,
	`humidity` integer NOT NULL,
	`wind_speed` real NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entry`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weather_entry_idx` ON `weather_record` (`entry_id`);