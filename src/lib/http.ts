import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const requestIdCache = new WeakMap<Request, string>();

export const getRequestId = (req: Request): string => {
  const headerValue = req.headers.get("x-request-id")?.trim();
  if (headerValue) {
    return headerValue;
  }

  const cached = requestIdCache.get(req);
  if (cached) {
    return cached;
  }

  const generated = randomUUID();
  requestIdCache.set(req, generated);
  return generated;
};

export const jsonWithRequestId = <T>(
  requestId: string,
  body: T,
  init?: ResponseInit,
): NextResponse => {
  const response = NextResponse.json(body, init);
  response.headers.set("x-request-id", requestId);
  return response;
};

export const errorResponseWithRequestId = (
  requestId: string,
  status: number,
  code: string,
  message: string,
): NextResponse => {
  return jsonWithRequestId(
    requestId,
    {
      error: {
        code,
        message,
        requestId,
      },
    },
    { status },
  );
};
