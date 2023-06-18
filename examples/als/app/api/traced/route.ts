import { NextResponse } from "next/server";
import { getTraceId, traced } from "../wrappers";

export const GET = traced(() => {
  return NextResponse.json({ id: getTraceId() });
});
