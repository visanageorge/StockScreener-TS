import { getToken } from "./api";

export function isAuthed(): boolean {
  return !!getToken();
}
