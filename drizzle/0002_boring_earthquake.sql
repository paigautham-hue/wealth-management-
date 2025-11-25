CREATE TABLE `family_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `family_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','family_admin','family_viewer') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `familyId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `profilePicture` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;