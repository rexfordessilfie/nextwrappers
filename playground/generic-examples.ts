import { NextApiRequest, NextApiResponse } from "next";
import { typedWrapper } from "./generic";
import { NextResponse, NextRequest } from "next/server";

const serverActionWrapper = typedWrapper<void, [FormData]>();
const apiRouteWrapper = typedWrapper<void, [NextApiRequest, NextApiResponse]>();
const routeHandlerWrapper = typedWrapper<
  NextResponse,
  [NextRequest, { params: Record<string, any> }]
>();

export const apiRouteLogger = apiRouteWrapper(
  (next, req: NextRequest & { test: boolean }) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
  }
);

export const routeHandlerLogger = routeHandlerWrapper(
  (next, req: NextRequest & { test: string }) => {
    console.log(`[${req.method}] ${req.url}`);
    return next();
  }
);

export const serverActionLogger = serverActionWrapper(
  (next, formData: FormData) => {
    console.log(formData);
    return next();
  }
);

export const addWrapper = typedWrapper()((next, a: number, b: number) => {
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
