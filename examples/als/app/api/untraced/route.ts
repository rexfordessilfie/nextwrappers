import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export const GET = () => {
  return NextResponse.json({ id: uuid() });
};
