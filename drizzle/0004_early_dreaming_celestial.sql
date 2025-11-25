CREATE TABLE `alternative_investments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('private_equity','venture_capital','real_estate','cryptocurrency','art','collectibles','commodities','hedge_fund','other') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`investmentAmount` int NOT NULL,
	`currentValue` int NOT NULL,
	`acquisitionDate` timestamp,
	`liquidityStatus` enum('liquid','semi_liquid','illiquid') DEFAULT 'illiquid',
	`expectedExitDate` timestamp,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alternative_investments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fixed_income_holdings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('government_bond','corporate_bond','municipal_bond','treasury','cd','other') NOT NULL,
	`name` varchar(255) NOT NULL,
	`issuer` varchar(255),
	`faceValue` int NOT NULL,
	`purchasePrice` int NOT NULL,
	`currentValue` int NOT NULL,
	`couponRate` int NOT NULL,
	`maturityDate` timestamp,
	`purchaseDate` timestamp,
	`duration` int,
	`yieldToMaturity` int,
	`rating` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fixed_income_holdings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insurance_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('life','health','property','auto','liability','umbrella','other') NOT NULL,
	`policyName` varchar(255) NOT NULL,
	`provider` varchar(255),
	`policyNumber` varchar(255),
	`coverageAmount` int NOT NULL,
	`annualPremium` int NOT NULL,
	`cashValue` int,
	`startDate` timestamp,
	`expiryDate` timestamp,
	`beneficiaries` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insurance_policies_id` PRIMARY KEY(`id`)
);
