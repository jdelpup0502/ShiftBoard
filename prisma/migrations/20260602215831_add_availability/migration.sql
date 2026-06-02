-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Availability_userId_weekStart_dayOfWeek_key" ON "Availability"("userId", "weekStart", "dayOfWeek");
