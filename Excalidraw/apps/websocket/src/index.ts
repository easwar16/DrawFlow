import dotenv from "dotenv";
import { WebSocket, WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonWebToken";
import { prisma } from "@repo/db-schema/client";
dotenv.config({ path: "../../.env" });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const Users: User[] = [];

interface JwtUserPayload extends JwtPayload {
  name: string;
  id: string;
}
function checkUser(token: string): string | null {
  try {
    const decoded: JwtUserPayload = jwt.verify(
      token,
      process.env.JWT_SECRET ?? ""
    ) as JwtUserPayload;

    if (!decoded || !decoded.id) {
      wss.close();
      return null;
    }
    return decoded.id;
  } catch (err) {
    return null;
  }
  return null;
}

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (socket, Request) => {
  let url = Request.url;
  if (!url) {
    return;
  }

  const headerToken = Request.headers["token"];

  console.log(headerToken);

  const queryParams = new URLSearchParams(url.split("?")[1]);

  const token = queryParams.get("token") as string;

  const userId = checkUser(token);
  console.log(!userId);
  if (userId === null) {
    socket.close();
  }

  Users.push({ rooms: [], userId: userId as string, ws: socket });

  socket.on("message", async (data) => {
    const parsedData = JSON.parse(data as unknown as string);

    if (parsedData.type === "join_room") {
      const user = Users.find((e) => e.ws === socket);
      user?.rooms.push(parsedData.roomId);
      console.log(Users);
    }
    if (parsedData.type === "chat") {
      await prisma.chat.create({
        data: {
          roomId: parsedData.roomId,
          message: parsedData.message,
          userId: Number(userId),
        },
      });
      Users.forEach((user) => {
        console.log(user);

        if (user.rooms.includes(parsedData.roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              roomId: parsedData.roomId,
              message: parsedData.message,
            })
          );
        }
      });
    }
  });
});
