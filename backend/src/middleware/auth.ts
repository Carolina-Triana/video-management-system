import { Request, Response, NextFunction } from "express";

/**
 * Middleware to validate admin API key for protected endpoints.
 * Checks the x-admin-key header against the ADMIN_API_KEY environment variable.
 *
 * Requirements: 2.6, 4.3, 5.3
 */
export function requireAdminKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const providedKey = req.headers["x-admin-key"];
  const adminKey = process.env.ADMIN_API_KEY;

  if (!providedKey) {
    res.status(401).json({ error: "Missing x-admin-key header" });
    return;
  }

  if (providedKey !== adminKey) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  next();
}
