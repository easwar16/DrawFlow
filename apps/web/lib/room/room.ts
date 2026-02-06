import { nanoid } from "nanoid";

export function createRoomId() {
  return nanoid(10);
}
