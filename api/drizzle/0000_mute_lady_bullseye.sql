CREATE TABLE `admin` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_username_unique` ON `admin` (`username`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`tags` text NOT NULL,
	`url` text NOT NULL,
	`thumbnail` text,
	`created_at` text NOT NULL,
	`featured` integer DEFAULT false,
	`og_title` text,
	`og_description` text,
	`og_image` text,
	`view_count` integer DEFAULT 0,
	`created_at_ts` integer,
	`updated_at` integer
);
