import { v4 as uuid } from "uuid";

export const GET = () => {
  return new Response(uuid());
};
