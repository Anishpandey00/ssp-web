// New installations have no administrator unless credentials are supplied explicitly.
// Existing administrator accounts are never reset by this function.
export async function seedAdmin(query, env = process.env) {
  const existing = await query("SELECT id FROM users WHERE is_admin = TRUE LIMIT 1");
  if (existing.rows.length > 0) return;

  const email = env.ADMIN_EMAIL?.trim();
  const password = env.ADMIN_PASSWORD;
  if (!email && !password) return;
  if (!email || !password || password.length < 12) {
    throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.");
  }

  const { randomUUID } = await import("node:crypto");
  const { default: bcrypt } = await import("bcrypt");
  const hashedPassword = await bcrypt.hash(password, 10);
  await query(
    "INSERT INTO users (id, name, email, password, is_admin) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING",
    [randomUUID(), "Admin", email, hashedPassword, true],
  );
}
