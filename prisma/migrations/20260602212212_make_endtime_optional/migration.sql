-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "jobTitle" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "isTraining" BOOLEAN NOT NULL DEFAULT false,
    "traineeUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Shift_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Shift_traineeUserId_fkey" FOREIGN KEY ("traineeUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Shift" ("assignedUserId", "createdAt", "date", "endTime", "id", "isTraining", "jobTitle", "startTime", "traineeUserId") SELECT "assignedUserId", "createdAt", "date", "endTime", "id", "isTraining", "jobTitle", "startTime", "traineeUserId" FROM "Shift";
DROP TABLE "Shift";
ALTER TABLE "new_Shift" RENAME TO "Shift";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
