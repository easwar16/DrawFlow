import cors from "cors";
import {
  createRoomSchema,
  userSigninSchema,
  userSigninType,
  userSignupSchema,
  userSignupType,
} from "@repo/backend-common/zod";
import { prisma } from "@repo/db-schema/client";
import jwt from "jsonwebtoken";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { errorHandler } from "./errorhandler";
import { middleWare } from "./middleWare";
declare module "express" {
  interface Request {
    userId?: string;
  }
}
dotenv.config({ path: "../../.env" });
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // EXACT frontend URL
    credentials: true,
  })
);

app.post("/signup", async (req, res) => {
  const body: userSignupType = req.body;
  const isValid = userSignupSchema.safeParse(req.body);
  if (isValid?.success) {
    const userExists = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (userExists?.id) {
      return res.status(409).json({ message: "User already Exists" });
    } else {
      const user = await prisma.user.create({
        data: {
          email: body.email,
          name: body?.name,
          password: body.password,
          photo: body?.photo ?? "",
        },
      });
      if (user.id) {
        return res
          .status(200)
          .json({ message: "User Created Successfully", userId: user.id });
      }
      throw new Error();
    }
  } else {
    return res.status(403).json({ message: "Invalid details" });
  }
});
app.post("/signin", async (req, res) => {
  const body: userSigninType = req.body;
  const isValid = userSigninSchema.safeParse(req.body);
  if (isValid?.success) {
    const userExists = await prisma.user.findUnique({
      where: { email: body.email, password: body.password },
    });
    if (!userExists?.id) {
      return res.status(403).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { name: userExists?.name, id: userExists?.id },
      process.env.JWT_SECRET ?? ""
    );
    res.cookie("auth_token", token, {
      httpOnly: false, // 🔒 JS cannot read
      secure: false,
      sameSite: "lax", // important for Next.js
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({ token: token });
  } else {
    return res.status(403).json({ message: "Invalid details" });
  }
});

app.post("/room", middleWare, async (req: Request, res: Response) => {
  const parsedData = createRoomSchema.safeParse(req.body);
  const userId = req.userId as number | undefined;
  if (!parsedData.success) {
    return res.status(403).json({ message: "Invalid Inputs" });
  } else {
    try {
      const room = await prisma.room.create({
        data: {
          slug: parsedData.data.slug,
          adminId: userId ?? 0,
        },
      });
      return res.status(200).json({ rooomId: room.id });
    } catch (err) {
      return res.status(411).json({ message: "Room Already exists" });
    }
  }
});

app.get("/chats/room/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId) as number;
  const messages = await prisma.chat.findMany({
    where: {
      roomId: roomId,
    },
    orderBy: { id: "desc" },
    take: 50,
  });
  return res.status(200).json({ messages });
});
app.get("/room/:slug", async (req, res) => {
  const slug = req.params.slug;
  const room = await prisma.room.findFirst({
    where: {
      slug,
    },
  });
  return res.status(200).json({ roomId: room?.id });
});

app.use(errorHandler);

app.listen(process.env.HTTP_PORT, () => {
  console.log("Listening on : " + process.env.HTTP_PORT);
});
