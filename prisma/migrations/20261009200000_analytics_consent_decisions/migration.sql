CREATE TABLE `analytics_consent_decisions` (
  `decisionId` CHAR(36) NOT NULL,
  `decision` VARCHAR(8) NOT NULL,
  `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`decisionId`),
  INDEX `analytics_consent_decisions_occurredAt_decision_idx` (`occurredAt`, `decision`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
