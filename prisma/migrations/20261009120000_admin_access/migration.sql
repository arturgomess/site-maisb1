CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` VARCHAR(30) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `email` VARCHAR(254) NOT NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'EDITOR',
  `canManagePosts` BOOLEAN NOT NULL DEFAULT TRUE,
  `canManageSettings` BOOLEAN NOT NULL DEFAULT FALSE,
  `canManageAccess` BOOLEAN NOT NULL DEFAULT FALSE,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `mustChangePassword` BOOLEAN NOT NULL DEFAULT FALSE,
  `lastAccessAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `admin_users_email_key` (`email`),
  INDEX `admin_users_isActive_role_idx` (`isActive`, `role`),
  INDEX `admin_users_name_idx` (`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `id` VARCHAR(30) NOT NULL,
  `tokenHash` CHAR(64) NOT NULL,
  `userId` VARCHAR(30) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `admin_sessions_tokenHash_key` (`tokenHash`),
  INDEX `admin_sessions_userId_expiresAt_idx` (`userId`, `expiresAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `admin_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_audit_events` (
  `id` VARCHAR(30) NOT NULL,
  `targetId` VARCHAR(30) NULL,
  `actorId` VARCHAR(30) NULL,
  `action` VARCHAR(60) NOT NULL,
  `details` LONGTEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `admin_audit_events_targetId_createdAt_idx` (`targetId`, `createdAt`),
  INDEX `admin_audit_events_actorId_createdAt_idx` (`actorId`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `admin_audit_events_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `admin_audit_events_targetId_fkey` FOREIGN KEY (`targetId`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_bootstrap` (
  `id` INTEGER NOT NULL DEFAULT 1,
  `usedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `admin_bootstrap` (`id`, `usedAt`) VALUES (1, NULL);
