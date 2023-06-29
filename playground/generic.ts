import { NextApiRequest, NextApiResponse } from "next";
import { createWrapper, typedWrapperCreator } from "@nextwrappers/generic";
import { NextRequest, NextResponse } from "next/server";

const createServerActionWrapper = typedWrapperCreator<[FormData], void>();
const createApiRouteWrapper = typedWrapperCreator<
  [NextApiRequest, NextApiResponse],
  void
>();
const createRouteHandlerWrapper = typedWrapperCreator<
  [NextRequest, { params: Record<string, any> }],
  NextResponse
>();

export const apiRouteLogger = createApiRouteWrapper((next, req) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

export const routeHandlerLogger = createRouteHandlerWrapper(
  (next, req: NextRequest & { test: string }) => {
    console.log(`[${req.method}] ${req.url}`);
    return next();
  }
);

export const serverActionLogger = createServerActionWrapper(
  (next, formData: FormData) => {
    console.log(formData);
    return next();
  }
);

export const addWrapper = createWrapper((next, a: number, b: number) => {
  console.log(`First arg: ${a}, Second Arg: ${b}`);

  if (Math.random() > 0.5) {
    return false;
  }

  return next();
});

const addNumbers = addWrapper((a: number, b: number) => {
  return a + b;
});

const result = addNumbers(2, 4);
console.log(result);
