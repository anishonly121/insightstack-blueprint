import { NextResponse } from "next/server";
import { getUserFromRequest, type PublicUser } from "@/lib/auth";
import { errorResponseWithRequestId, getRequestId } from "@/lib/http";

type RequireAdminResult =
  | { user: PublicUser; error?: never }
  | { user?: never; error: NextResponse };

export const requireAdmin = async (
  req: Request,
): Promise<RequireAdminResult> => {
  const requestId = getRequestId(req);
  const user = await getUserFromRequest(req);

  if (!user) {
    return {
      error: errorResponseWithRequestId(requestId, 401, "UNAUTHORIZED", "Missing or invalid token"),
    };
  }

  if (user.role !== "ADMIN") {
    return {
      error: errorResponseWithRequestId(requestId, 403, "FORBIDDEN", "Admin access required"),
    };
  }

  return { user };
};
