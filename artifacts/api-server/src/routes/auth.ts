import { clerkClient, getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetAuthProfileResponse,
  SyncAuthProfileResponse,
} from "@workspace/api-zod";
import { appUsersTable, db } from "@workspace/db";

const router: IRouter = Router();

router.post("/auth/profile", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Inicie sessão para continuar." });
    return;
  }

  const clerkUser = await clerkClient.users.getUser(userId);
  const values = {
    clerkUserId: userId,
    email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  };

  const [profile] = await db
    .insert(appUsersTable)
    .values(values)
    .onConflictDoUpdate({
      target: appUsersTable.clerkUserId,
      set: {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: appUsersTable.clerkUserId,
      email: appUsersTable.email,
      firstName: appUsersTable.firstName,
      lastName: appUsersTable.lastName,
      createdAt: appUsersTable.createdAt,
      updatedAt: appUsersTable.updatedAt,
    });

  if (!profile) {
    res.status(500).json({ error: "Não foi possível guardar o perfil." });
    return;
  }

  res.json(GetAuthProfileResponse.parse(profile));
});

router.get("/auth/profile", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Inicie sessão para continuar." });
    return;
  }

  const [profile] = await db
    .select({
      id: appUsersTable.clerkUserId,
      email: appUsersTable.email,
      firstName: appUsersTable.firstName,
      lastName: appUsersTable.lastName,
      createdAt: appUsersTable.createdAt,
      updatedAt: appUsersTable.updatedAt,
    })
    .from(appUsersTable)
    .where(eq(appUsersTable.clerkUserId, userId));

  if (!profile) {
    res.status(404).json({ error: "Perfil ainda não sincronizado." });
    return;
  }

  res.json(SyncAuthProfileResponse.parse(profile));
});

export default router;
