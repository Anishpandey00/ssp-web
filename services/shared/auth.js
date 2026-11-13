// Login-token checks shared by every service. Each service verifies the token
// itself with the shared JWT_SECRET; none of them calls the Auth service.
import jwt from "jsonwebtoken";

export function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set. Every service needs the same secret.");
  return secret;
}

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }
  try {
    req.user = jwt.verify(auth.slice(7), jwtSecret());
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid or expired token." });
  }
}

export function requireOwner(req, res, next) {
  if (req.params.userId && req.params.userId !== req.user.id) {
    return res.status(403).json({ ok: false, error: "Forbidden." });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ ok: false, error: "Admin access required." });
  }
  next();
}
