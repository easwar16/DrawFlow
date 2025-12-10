import {
  userSigninSchema,
  userSigninType,
  userSignupSchema,
  userSignupType,
} from "./schemas";
import { prisma } from "@repo/db-schema/client";
import jwt from "jsonwebtoken";
import express from "express";
import dotenv from "dotenv";
import { errorHandler } from "./lib";
import id from "zod/v4/locales/id.js";
dotenv.config();
const app = express();

app.use(express.json());

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
        return res.status(200).json({ message: "User Created Successfully" });
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
    return res.status(200).json({ token: token });
  } else {
    return res.status(403).json({ message: "Invalid details" });
  }
});

app.post("/room", async (req, res) => {});

app.use(errorHandler);

app.listen(process.env.HTTP_PORT, () => {
  console.log("Listening on : " + process.env.HTTP_PORT);
});
