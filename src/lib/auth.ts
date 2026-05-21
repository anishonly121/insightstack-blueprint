import "server-only";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type TokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
};

export const AUTH_COOKIE_NAME = "insightstack_token";
export const AUTH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const getJwtSecret = (): string => {
  return env.JWT_SECRET;
};

const isRole = (value: unknown): value is Role => {
  return value === "USER" || value === "ADMIN";
};

export const signToken = (user: PublicUser): string => {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
};

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, getJwtSecret());

  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  const payload = decoded as JwtPayload;

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    !isRole(payload.role)
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
};

const getCookieValueFromHeader = (cookieHeader: string, name: string): string | null => {
  const cookiesList = cookieHeader.split(";");
  for (const cookieItem of cookiesList) {
    const [rawName, ...rawValueParts] = cookieItem.trim().split("=");
    if (rawName !== name) continue;
    const rawValue = rawValueParts.join("=");
    if (!rawValue) return null;
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }
  return null;
};

export const getTokenFromRequest = (req: Request): string | null => {
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const [scheme, token] = authHeader.split(" ");
    if (scheme === "Bearer" && token) {
      return token;
    }
  }

  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  return getCookieValueFromHeader(cookieHeader, AUTH_COOKIE_NAME);
};

const getUserByToken = async (token: string): Promise<PublicUser | null> => {
  const payload = verifyToken(token);
  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, role: true },
  });
};

export const getUserFromRequest = async (
  req: Request,
): Promise<PublicUser | null> => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }

  try {
    return await getUserByToken(token);
  } catch {
    return null;
  }
};

export const getUserFromServerCookie = async (): Promise<PublicUser | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return null;
    }
    return await getUserByToken(token);
  } catch {
    return null;
  }
};
