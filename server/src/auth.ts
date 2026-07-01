import crypto from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "./env.js";
import { prisma } from "./db.js";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
};

export function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(`${env.SESSION_SECRET}:${token}`).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(36).toString("base64url");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt
    }
  });

  return { token, expiresAt };
}

export function setSessionCookie(reply: FastifyReply, token: string, expiresAt: Date) {
  reply.setCookie("pmagic_session", token, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt
  });
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie("pmagic_session", { path: "/" });
}

export async function getAuthUser(request: FastifyRequest): Promise<AuthUser | null> {
  const token = request.cookies.pmagic_session;
  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: hashSessionToken(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
      user: { status: "ACTIVE" }
    },
    include: { user: true }
  });

  if (!session) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role
  };
}

export async function requireUser(request: FastifyRequest, reply: FastifyReply) {
  const user = await getAuthUser(request);
  if (!user) {
    return reply.code(401).send({ error: "UNAUTHORIZED" });
  }

  request.user = user;
}

export function requireRole(roles: AuthUser["role"][]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getAuthUser(request);
    if (!user) {
      return reply.code(401).send({ error: "UNAUTHORIZED" });
    }

    request.user = user;
    if (!roles.includes(user.role)) {
      return reply.code(403).send({ error: "FORBIDDEN" });
    }
  };
}
