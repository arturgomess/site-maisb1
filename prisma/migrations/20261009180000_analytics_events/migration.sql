ALTER TABLE `admin_users`
  ADD COLUMN `canManageAnalytics` BOOLEAN NOT NULL DEFAULT false;

UPDATE `admin_users`
SET `canManageAnalytics` = true
WHERE `role` = 'ADMINISTRATOR' OR (`canManagePosts` = true AND `canManageSettings` = true AND `canManageAccess` = true);

CREATE TABLE `analytics_events` (
  `id` VARCHAR(30) NOT NULL,
  `eventId` VARCHAR(64) NOT NULL,
  `eventType` VARCHAR(24) NOT NULL,
  `occurredAt` DATETIME(3) NOT NULL,
  `path` VARCHAR(500) NOT NULL,
  `postId` VARCHAR(30) NULL,
  `visitorDigest` CHAR(64) NULL,
  `sourceCategory` VARCHAR(24) NOT NULL,
  `sourceHost` VARCHAR(255) NULL,
  `device` VARCHAR(16) NOT NULL,
  `engagedSeconds` INTEGER NOT NULL DEFAULT 0,
  UNIQUE INDEX `analytics_events_eventId_key` (`eventId`),
  INDEX `analytics_events_occurredAt_eventType_idx` (`occurredAt`, `eventType`),
  INDEX `analytics_events_postId_occurredAt_eventType_idx` (`postId`, `occurredAt`, `eventType`),
  INDEX `analytics_events_sourceCategory_occurredAt_idx` (`sourceCategory`, `occurredAt`),
  INDEX `analytics_events_visitorDigest_occurredAt_idx` (`visitorDigest`, `occurredAt`),
  INDEX `analytics_events_device_occurredAt_idx` (`device`, `occurredAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `analytics_events_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `posts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `analytics_visitors` (
  `visitorDigest` CHAR(64) NOT NULL,
  `consentedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `revokedAt` DATETIME(3) NULL,
  INDEX `analytics_visitors_lastSeenAt_idx` (`lastSeenAt`),
  INDEX `analytics_visitors_revokedAt_idx` (`revokedAt`),
  PRIMARY KEY (`visitorDigest`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
