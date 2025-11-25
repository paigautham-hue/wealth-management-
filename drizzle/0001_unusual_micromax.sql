CREATE TABLE `asset_ownership` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`ownerId` int NOT NULL,
	`ownershipPercentage` int NOT NULL DEFAULT 100,
	`costBasisInr` int NOT NULL,
	`costBasisNativeCurrency` int NOT NULL,
	`nativeCurrency` varchar(10) NOT NULL,
	`exchangeRateAtPurchase` int NOT NULL DEFAULT 100,
	`purchaseDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `asset_ownership_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetType` enum('stock','bond','mutual_fund','real_estate','alternative','cash') NOT NULL,
	`assetName` varchar(255) NOT NULL,
	`ticker` varchar(50),
	`currentValueInr` int NOT NULL DEFAULT 0,
	`currentQuantity` int NOT NULL DEFAULT 0,
	`currentPrice` int NOT NULL DEFAULT 0,
	`currency` varchar(10) NOT NULL DEFAULT 'INR',
	`country` varchar(100),
	`sector` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`response` text NOT NULL,
	`intent` varchar(100),
	`conversationId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `concierge_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`draftContent` json,
	`status` enum('pending_review','approved','rejected','completed','failed') NOT NULL DEFAULT 'pending_review',
	`userNotes` text,
	`executedAt` timestamp,
	`executionResult` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `concierge_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_portfolio_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`date` timestamp NOT NULL,
	`totalNetWorthInr` int NOT NULL,
	`totalLrsUsedUsd` int NOT NULL DEFAULT 0,
	`currencyBreakdown` json,
	`assetClassBreakdown` json,
	`sectorBreakdown` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_portfolio_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `ownerDateIdx` UNIQUE(`ownerId`,`date`)
);
--> statement-breakpoint
CREATE TABLE `document_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`filePath` varchar(500) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` int NOT NULL,
	`status` enum('pending','processing','completed','failed','needs_review') NOT NULL DEFAULT 'pending',
	`extractedData` json,
	`extractionErrors` json,
	`documentDate` timestamp,
	`institution` varchar(255),
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lrs_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`transactionDate` timestamp NOT NULL,
	`amountUsd` int NOT NULL,
	`purpose` varchar(255) NOT NULL,
	`description` text,
	`assetId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lrs_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunity_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`opportunityType` varchar(100) NOT NULL,
	`ticker` varchar(50),
	`title` varchar(255) NOT NULL,
	`description` text,
	`thesis` text,
	`risks` text,
	`suggestedAction` text,
	`potentialBenefitInr` int,
	`timeRequiredMinutes` int,
	`confidenceScore` int,
	`status` enum('new','viewed','dismissed','acted') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opportunity_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticker` varchar(50) NOT NULL,
	`market` enum('IN','US') NOT NULL,
	`analysisDate` timestamp NOT NULL,
	`buffettScore` int NOT NULL,
	`buffettVerdict` text,
	`lynchScore` int NOT NULL,
	`lynchVerdict` text,
	`grahamScore` int NOT NULL,
	`grahamVerdict` text,
	`fisherScore` int NOT NULL,
	`fisherVerdict` text,
	`jhunjhunwalaScore` int NOT NULL,
	`jhunjhunwalaVerdict` text,
	`kacholiaScore` int NOT NULL,
	`kacholiaVerdict` text,
	`kediaScore` int NOT NULL,
	`kediaVerdict` text,
	`quantitativeScore` int NOT NULL,
	`quantitativeVerdict` text,
	`finalScore` int NOT NULL,
	`recommendation` enum('STRONG_BUY','BUY','HOLD','SELL','STRONG_SELL') NOT NULL,
	`confidence` int NOT NULL,
	`currentPrice` int NOT NULL,
	`targetPrice` int NOT NULL,
	`upsidePercentage` int NOT NULL,
	`executiveSummary` text,
	`strengths` json,
	`risks` json,
	`bearCase` text,
	`fullReport` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`riskTolerance` enum('conservative','moderate','aggressive') DEFAULT 'moderate',
	`targetAllocation` json,
	`persona` varchar(100),
	`theme` enum('light','dark') DEFAULT 'light',
	`emailNotifications` boolean DEFAULT true,
	`pushNotifications` boolean DEFAULT true,
	`aiLensWeights` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `valuation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`date` timestamp NOT NULL,
	`valueInr` int NOT NULL,
	`quantity` int NOT NULL,
	`price` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `valuation_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `assetIdIdx` ON `asset_ownership` (`assetId`);--> statement-breakpoint
CREATE INDEX `ownerIdIdx` ON `asset_ownership` (`ownerId`);--> statement-breakpoint
CREATE INDEX `tickerIdx` ON `assets` (`ticker`);--> statement-breakpoint
CREATE INDEX `assetTypeIdx` ON `assets` (`assetType`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `chat_conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `conversationIdIdx` ON `chat_conversations` (`conversationId`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `concierge_tasks` (`userId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `concierge_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `ownerIdIdx` ON `daily_portfolio_snapshots` (`ownerId`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `document_uploads` (`userId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `document_uploads` (`status`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `lrs_transactions` (`userId`);--> statement-breakpoint
CREATE INDEX `transactionDateIdx` ON `lrs_transactions` (`transactionDate`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `opportunity_alerts` (`userId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `opportunity_alerts` (`status`);--> statement-breakpoint
CREATE INDEX `tickerMarketIdx` ON `stock_analyses` (`ticker`,`market`);--> statement-breakpoint
CREATE INDEX `analysisDateIdx` ON `stock_analyses` (`analysisDate`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `user_preferences` (`userId`);--> statement-breakpoint
CREATE INDEX `assetDateIdx` ON `valuation_history` (`assetId`,`date`);