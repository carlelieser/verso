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