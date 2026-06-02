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
}
