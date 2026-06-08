export async function register() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required.");
  }
  if (!process.env.SESSION_PASSWORD || process.env.SESSION_PASSWORD.length < 32) {
    throw new Error("SESSION_PASSWORD must be set and at least 32 characters long.");
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DATABASE_URL.startsWith("file:./")
  ) {
    console.warn(
      "[ShiftBoard] WARNING: DATABASE_URL uses a relative path in production. " +
        "Use an absolute path like file:/data/prod.db to ensure data persists across restarts.",
    );
  }

  // Enable WAL mode — persists in the DB file so all future connections use it.
  // WAL allows concurrent reads during writes, preventing SQLITE_BUSY under load.
  try {
    const Database = (await import("better-sqlite3")).default;
    const dbPath = process.env.DATABASE_URL.replace(/^file:/, "");
    const setup = new Database(dbPath);
    setup.pragma("journal_mode = WAL");
    setup.pragma("busy_timeout = 5000");
    setup.close();
  } catch {
    // Non-fatal — app continues without WAL if the DB isn't accessible yet
  }
}
