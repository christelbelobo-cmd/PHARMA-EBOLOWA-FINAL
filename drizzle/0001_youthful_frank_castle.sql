CREATE TABLE `medications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`dci` varchar(255),
	`therapeuticCategory` varchar(255),
	`dosage` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pharmacies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`openingHours` text,
	`mapLink` text,
	`isOnDuty` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pharmacies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stockEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`medicationId` int NOT NULL,
	`pharmacyId` int NOT NULL,
	`status` enum('available','low_stock','on_order','out_of_stock') NOT NULL DEFAULT 'available',
	`price` decimal(10,2),
	`quantity` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stockEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','pharmacist') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `pharmacyId` int;--> statement-breakpoint
ALTER TABLE `stockEntries` ADD CONSTRAINT `stockEntries_medicationId_pharmacyId_medications_id_id_fk` FOREIGN KEY (`medicationId`,`pharmacyId`) REFERENCES `medications`(`id`,`id`) ON DELETE no action ON UPDATE no action;