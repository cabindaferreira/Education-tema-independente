import { clerkClient, getAuth } from "@clerk/express";
import type { Request, Response } from "express";

type AcademyUser = Awaited<ReturnType<typeof clerkClient.users.getUser>>;

function rolesFor(user: AcademyUser): string[] {
  const metadata = user.privateMetadata as Record<string, unknown>;
  const roleList = Array.isArray(metadata.academyRoles)
    ? metadata.academyRoles.filter((role): role is string => typeof role === "string")
    : [];
  const legacyRole = metadata.academyRole;
  return [...new Set([...roleList, ...(typeof legacyRole === "string" ? [legacyRole] : [])])];
}

export function hasAcademyRole(user: AcademyUser, role: string): boolean {
  const metadata = user.privateMetadata as Record<string, unknown>;
  if (role === "academy_admin" && (metadata.academyOwner === true || metadata.academyRole === "admin")) {
    return true;
  }
  return rolesFor(user).includes(role);
}

function hasVerifiedOwnerEmail(user: AcademyUser): boolean {
  const configuredEmail = process.env.ACADEMY_OWNER_EMAIL?.trim().toLowerCase();
  if (!configuredEmail) return false;
  return user.emailAddresses.some((email) =>
    email.emailAddress.trim().toLowerCase() === configuredEmail
    && email.verification?.status === "verified",
  );
}

async function bootstrapConfiguredOwner(user: AcademyUser): Promise<AcademyUser> {
  if (!hasVerifiedOwnerEmail(user)) return user;

  const metadata = user.privateMetadata as Record<string, unknown>;
  const roles = rolesFor(user);
  if (metadata.academyOwner === true && roles.includes("academy_admin")) return user;

  return clerkClient.users.updateUserMetadata(user.id, {
    privateMetadata: {
      ...metadata,
      academyOwner: true,
      academyRoles: [...new Set([...roles, "academy_admin"])],
    },
  });
}

export async function getAcademyAdmin(
  req: Request,
  res: Response,
): Promise<{ user: AcademyUser; userId: string; isOwner: boolean } | null> {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Inicie sessão para continuar." });
    return null;
  }

  let user = await clerkClient.users.getUser(userId);
  user = await bootstrapConfiguredOwner(user);
  const isOwner = (user.privateMetadata as Record<string, unknown>).academyOwner === true;
  if (!isOwner && !hasAcademyRole(user, "academy_admin")) {
    res.status(403).json({ error: "Esta área está reservada à administração da Academia." });
    return null;
  }

  return { user, userId, isOwner };
}

export async function getAcademyOwner(
  req: Request,
  res: Response,
): Promise<{ user: AcademyUser; userId: string } | null> {
  const admin = await getAcademyAdmin(req, res);
  if (!admin) return null;
  if (!admin.isOwner) {
    res.status(403).json({ error: "Apenas a conta proprietária pode gerir os acessos." });
    return null;
  }
  return { user: admin.user, userId: admin.userId };
}

export function primaryVerifiedEmail(user: AcademyUser): string | null {
  const primary = user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId);
  return primary?.verification?.status === "verified" ? primary.emailAddress : null;
}

export function academyTeamMember(user: AcademyUser, isOwner: boolean) {
  const email = primaryVerifiedEmail(user);
  if (!email) return null;
  return {
    userId: user.id,
    email,
    firstName: user.firstName,
    lastName: user.lastName,
    isOwner,
    createdAt: new Date(user.createdAt).toISOString(),
  };
}
