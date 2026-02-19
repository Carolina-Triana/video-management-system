import app from "../src/app";
import { Request, Response } from "express";

// Vercel serverless function handler
export default (req: Request, res: Response) => {
  return app(req, res);
};
