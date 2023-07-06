import { NextApiRequest, NextApiResponse } from "next";
import { createWrapper, typedWrapperCreator } from "@nextwrappers/generic";
import { NextRequest } from "next/server";

const createServerActionWrapper = typedWrapperCreator<[FormData], void>();
const createApiRouteWrapper = typedWrapperCreator<
  [NextApiRequest, NextApiResponse],
  void
>();
const createRouteHandlerWrapper = typedWrapperCreator<[NextRequest, any]>();

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

const handler = routeHandlerLogger(
  (req, params: { id: string; name: number }) => {
    return new Response("OK");
  }
);
