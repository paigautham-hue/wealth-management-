CREATE TABLE `liabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('mortgage','personal_loan','auto_loan','credit_card','student_loan','business_loan','other') NOT NULL,
	`name` varchar(255) NOT NULL,
	`lender` varchar(255),
	`principalAmount` int NOT NULL,
	`currentBalance` int NOT NULL,
	`interestRate` int NOT NULL,
	`monthlyPayment` int,
	`startDate` timestamp,
	`maturityDate` timestamp,
	`collateral` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `liabilities_id` PRIMARY KEY(`id`)
);
