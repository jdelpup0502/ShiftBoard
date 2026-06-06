-- Rename email → username on the User table
-- Uses a table rebuild (required by SQLite for NOT NULL + column removal).
-- Foreign key enforcement is disabled for the duration so the DROP succeeds.

PRAGMA foreign_keys=OFF;

-- 1. Temporary table with the new shape
CREATE TABLE "User_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Copy rows (use email as the initial username value)
INSERT INTO "User_new" ("id", "username", "passwordHash", "name", "role", "isAdmin", "createdAt")
SELECT "id", "email", "passwordHash", "name", "role", "isAdmin", "createdAt" FROM "User";

-- 3. Swap tables
DROP TABLE "User";
ALTER TABLE "User_new" RENAME TO "User";

-- 4. Unique index
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

PRAGMA foreign_keys=ON;
