import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { enforceCsrfIfCookieAuth } from "@/lib/csrf";
import { getRequestId, jsonWithRequestId, errorResponseWithRequestId } from "@/lib/http";

const bodySchema = z.object({
  emailDigestEnabled: z.boolean(),
});

export async function PATCH(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const csrfError = enforceCsrfIfCookieAuth(req, requestId);
  if (csrfError) return csrfError;

  const user = await getUserFromRequest(req);
  if (!user) return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponseWithRequestId(requestId, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid body");
    }
    body = parsed.data;
  } catch {
    return errorResponseWithRequestId(requestId, 400, "BAD_REQUEST", "Invalid JSON body");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailDigestEnabled: body.emailDigestEnabled },
  });

  return jsonWithRequestId(requestId, { data: { emailDigestEnabled: body.emailDigestEnabled } });
}

export async function GET(req: Request): Promise<NextResponse> {
  const requestId = getRequestId(req);
  const user = await getUserFromRequest(req);
  if (!user) return errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token");

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { emailDigestEnabled: true },
  });

  return jsonWithRequestId(requestId, { data: { emailDigestEnabled: record?.emailDigestEnabled ?? true } });
}
