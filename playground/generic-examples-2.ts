import { NextApiRequest, NextApiResponse } from "next";
import { genericWrapper, typedWrapper } from "./generic-2";
import { NextRequest } from "next/server";

const serverActionWrapper = typedWrapper<[FormData], void>();
const apiRouteWrapper = typedWrapper<[NextApiRequest, NextApiResponse], void>();
const routeHandlerWrapper = typedWrapper<
  [NextRequest, { params: Record<string, any> }],
  never
>();

export const apiRouteLogger = apiRouteWrapper((next, req) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

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

export const addWrapper = genericWrapper((next, a: number, b: number) => {
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
