import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import type { Request, Response, NextFunction } from "express";

dotenv.config({ path: "../../.env" });

interface JwtUserPayload extends JwtPayload {
  name: string;
  id: string;
}
export const middleWare = (req: Request, res: Response, next: NextFunction) => {
  const headerToken = req.headers["authorization"] ?? "";
  const token = headerToken.split(" ")[1] as string;
  const decoded: JwtUserPayload = jwt.verify(
    token,
    process.env.JWT_SECRET ?? ""
  ) as JwtUserPayload;

  if (decoded?.id) {
    req.userId = decoded.id;
    next();
  } else {
    res.status(403).json({ message: "Unauthorized" });
  }
};
