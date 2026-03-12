import { Router, type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";

export const healthCheckRouter = Router();

healthCheckRouter.get("/", (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ status: "ok" });
});