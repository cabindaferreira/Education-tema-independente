import { and, count, desc, eq, gte, ilike, isNull, or, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { clerkClient } from "@clerk/express";
import {
  ArchiveAdminCourseParams,
  ArchiveAdminCourseResponse,
  AuthorizeAdminTeamMemberBody,
  AuthorizeAdminTeamMemberResponse,
  CreateAdminCourseBody,
  CreateAdminCourseResponse,
  CreateAdminMediaBody,
  CreateAdminMediaResponse,
  CreateAdminRoomBlockBody,
  CreateAdminRoomBlockResponse,
  GetAdminAccessResponse,
  GetAdminAgendaQueryParams,
  GetAdminAgendaResponse,
  GetAdminOverviewResponse,
  ListAdminCoursesResponse,
  ListAdminCustomersQueryParams,
  ListAdminCustomersResponse,
  ListAdminMediaResponse,
  ListAdminRoomBlocksQueryParams,
  ListAdminRoomBlocksResponse,
  ListAdminTeamResponse,
  ReleaseAdminRoomBlockParams,
  RemoveAdminMediaParams,
  RemoveAdminMediaResponse,
  RevokeAdminTeamMemberParams,
  UpdateAdminCourseBody,
  UpdateAdminCourseParams,
  UpdateAdminCourseResponse,
  UpdateAdminMediaBody,
  UpdateAdminMediaParams,
  UpdateAdminMediaResponse,
} from "@workspace/api-zod";
import {
  academyCoursesTable,
  academyMediaTable,
  courseEnrollmentsTable,
  db,
  roomAvailabilityBlocksTable,
  roomReservationsTable,
} from "@workspace/db";
import { academyTeamMember, getAcademyAdmin, getAcademyOwner, hasAcademyRole, primaryVerifiedEmail } from "../lib/admin-auth";
import { ensureDefaultAcademyCourses } from "../lib/course-catalog-db";
import { getAcademyObjectFile, setAcademyObjectVisibility } from "../lib/object-storage";
import { getRoom, hasRoom, isTodayOrFuture, isValidBookingDate, slotsOverlap } from "../lib/rooms";

const router: IRouter = Router();
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function publicMediaUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
}

function imageUrlIsSafe(imageUrl: string): boolean {
  if (imageUrl.startsWith("/images/") || imageUrl.startsWith("/api/storage/objects/uploads/")) return true;
  try {
    return new URL(imageUrl).protocol === "https:";
  } catch {
    return false;
  }
}

async function imageReferenceIsActive(imageUrl: string): Promise<boolean> {
  if (!imageUrl.startsWith("/api/storage/objects/")) return true;
  const objectPath = imageUrl.slice("/api/storage".length);
  const [media] = await db
    .select({ id: academyMediaTable.id })
    .from(academyMediaTable)
    .where(and(eq(academyMediaTable.objectPath, objectPath), isNull(academyMediaTable.archivedAt)))
    .limit(1);
  return Boolean(media);
}

function courseResult(course: typeof academyCoursesTable.$inferSelect) {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    duration: course.duration,
    priceKz: course.priceKz,
    imageUrl: course.imageUrl,
    published: course.published,
    enrollmentOpen: course.enrollmentOpen,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

function mediaResult(media: typeof academyMediaTable.$inferSelect) {
  return {
    id: media.id,
    title: media.title,
    altText: media.altText,
    objectPath: media.objectPath,
    url: publicMediaUrl(media.objectPath),
    roomId: media.roomId,
    contentType: media.contentType,
    sizeBytes: media.sizeBytes,
    createdAt: media.createdAt,
  };
}

function timeMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function validClockTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value)
    && Number(value.slice(0, 2)) < 24
    && Number(value.slice(3, 5)) < 60;
}

function adminReservationResult(reservation: typeof roomReservationsTable.$inferSelect) {
  if (!hasRoom(reservation.roomId)) return null;
  return {
    id: reservation.id,
    roomId: reservation.roomId,
    roomName: getRoom(reservation.roomId).name,
    date: reservation.bookingDate,
    startTime: reservation.startTime.slice(0, 5),
    endTime: reservation.endTime.slice(0, 5),
    durationMinutes: reservation.durationMinutes,
    priceKz: reservation.priceKz,
    status: reservation.status,
    name: reservation.name,
    company: reservation.company,
    cancelledBy: reservation.cancelledByName,
    cancelledAt: reservation.cancelledAt,
  };
}

async function roomBlocksFor(roomId: string, date: string) {
  const rows = await db
    .select()
    .from(roomAvailabilityBlocksTable)
    .where(and(
      eq(roomAvailabilityBlocksTable.roomId, roomId),
      eq(roomAvailabilityBlocksTable.bookingDate, date),
      isNull(roomAvailabilityBlocksTable.releasedAt),
    ))
    .orderBy(roomAvailabilityBlocksTable.startTime);
  return rows.map((block) => ({
    id: block.id,
    roomId: block.roomId,
    date: block.bookingDate,
    startTime: block.startTime.slice(0, 5),
    endTime: block.endTime.slice(0, 5),
    reason: block.reason,
    createdAt: block.createdAt,
  }));
}

router.get("/courses", async (_req, res): Promise<void> => {
  await ensureDefaultAcademyCourses();
  const courses = await db
    .select()
    .from(academyCoursesTable)
    .where(and(eq(academyCoursesTable.published, true), isNull(academyCoursesTable.archivedAt)))
    .orderBy(desc(academyCoursesTable.createdAt));
  res.json(courses.map(courseResult));
});

router.get("/admin/access", async (req, res): Promise<void> => {
  const access = await getAcademyAdmin(req, res);
  if (!access) return;
  res.json(GetAdminAccessResponse.parse({
    isAdmin: true,
    isOwner: access.isOwner,
    email: primaryVerifiedEmail(access.user),
  }));
});

router.get("/admin/overview", async (req, res): Promise<void> => {
  if (!(await getAcademyAdmin(req, res))) return;
  await ensureDefaultAcademyCourses();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Luanda",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [courseCount] = await db
    .select({ value: count() })
    .from(academyCoursesTable)
    .where(and(eq(academyCoursesTable.published, true), isNull(academyCoursesTable.archivedAt)));
  const [enrollmentCount] = await db
    .select({ value: count() })
    .from(courseEnrollmentsTable)
    .where(and(
      eq(courseEnrollmentsTable.paymentStatus, "pending"),
      gte(courseEnrollmentsTable.expiresAt, new Date()),
    ));
  const [reservationCount] = await db
    .select({ value: count() })
    .from(roomReservationsTable)
    .where(and(eq(roomReservationsTable.status, "confirmed"), gte(roomReservationsTable.bookingDate, today)));
  const [mediaCount] = await db
    .select({ value: count() })
    .from(academyMediaTable)
    .where(isNull(academyMediaTable.archivedAt));
  res.json(GetAdminOverviewResponse.parse({
    courses: courseCount?.value ?? 0,
    openEnrollments: enrollmentCount?.value ?? 0,
    upcomingReservations: reservationCount?.value ?? 0,
    mediaAssets: mediaCount?.value ?? 0,
  }));
});

router.get("/admin/courses", async (req, res): Promise<void> => {
  if (!(await getAcademyAdmin(req, res))) return;
  await ensureDefaultAcademyCourses();
  const courses = await db
    .select()
    .from(academyCoursesTable)
    .where(isNull(academyCoursesTable.archivedAt))
    .orderBy(desc(academyCoursesTable.createdAt));
  res.json(ListAdminCoursesResponse.parse(courses.map(courseResult)));
});

router.post("/admin/courses", async (req, res): Promise<void> => {
  if (!(await getAcademyAdmin(req, res))) return;
  const parsed = CreateAdminCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Verifique o nome, o preço, a duração e a imagem do curso." });
    return;
  }
  const input = parsed.data;
  if (!imageUrlIsSafe(input.imageUrl) || !await imageReferenceIsActive(input.imageUrl)
    || input.enrollmentOpen && !input.published) {
    res.status(400).json({ error: "A imagem deve estar ativa e as inscrições só podem abrir num curso publicado." });
    return;
  }
  try {
    const [course] = await db.insert(academyCoursesTable).values({
      ...input,
      id: input.id.trim(),
      title: input.title.trim(),
      description: input.description.trim(),
      duration: input.duration.trim(),
      imageUrl: input.imageUrl.trim(),
      updatedAt: new Date(),
    }).returning();
    res.status(201).json(CreateAdminCourseResponse.parse(courseResult(course)));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      res.status(409).json({ error: "Já existe um curso com este identificador." });
      return;
    }
    throw error;
  }
});

router.patch("/admin/courses/:courseId", async (req, res): Promise<void> => {
  if (!(await getAcademyAdmin(req, res))) return;
  const params = UpdateAdminCourseParams.safeParse(req.params);
  const parsed = UpdateAdminCourseBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Verifique os dados do curso." });
    return;
  }
  const input = parsed.data;
  if (!imageUrlIsSafe(input.imageUrl) || !await imageReferenceIsActive(input.imageUrl)
    || input.enrollmentOpen && !input.published) {
    res.status(400).json({ error: "A imagem deve estar ativa e as inscrições só podem abrir num curso publicado." });
    return;
  }
  const [course] = await db
    .update(academyCoursesTable)
    .set({
      ...input,
      title: input.title.trim(),
      description: input.description.trim(),
      duration: input.duration.trim(),
      imageUrl: input.imageUrl.trim(),
      updatedAt: new Date(),
    })
    .where(and(eq(academyCoursesTable.id, params.data.courseId), isNull(academyCoursesTable.archivedAt)))
    .returning();
  if (!course) {
    res.status(404).json({ error: "O curso não foi encontrado." });
    return;
  }
  res.json(UpdateAdminCourseResponse.parse(courseResult(course)));
});

router.post("/admin/courses/:courseId/archive", async (req, res): Promise<void> => {
  if (!(await getAcademyAdmin(req, res))) return;
  const parsed = ArchiveAdminCourseParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Identificador de curso inválido." });
    return;
  }
  const now = new Date();
  const [course] = await db
    .update(academyCoursesTable)
    .set({ archivedAt: now, published: false, enrollmentOpen: false, updatedAt: now })
    .where(and(eq(academyCoursesTable.id, parsed.data.courseId), isNull(academyCoursesTable.archivedAt)))
    .returning();
  if (!course) {
    res.status(404).json({ error: "O curso não foi encontrado." });
    return;
  }
  res.json(ArchiveAdminCourseResponse.parse(courseResult(course)));
});

router.get("/admin/team", async (req, res): Promise<void> => {
  if (!(await getAcademyOwner(req, res))) return;
  const result = await clerkClient.users.getUserList({ limit: 500 });
  const members = result.data.flatMap((user) => {
    const metadata = user.privateMetadata as Record<string, unknown>;
    const owner = metadata.academyOwner === true;
    if (!owner && !hasAcademyRole(user, "academy_admin")) return [];
    const member = academyTeamMember(user, owner);
    return member ? [member] : [];
  });
  res.json(ListAdminTeamResponse.parse(members));
});

router.post("/admin/team", async (req, res): Promise<void> => {
  if (!(await getAcademyOwner(req, res))) return;
  const parsed = AuthorizeAdminTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Indique um endereço de e-mail válido." });
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const result = await clerkClient.users.getUserList({ emailAddress: [email], limit: 10 });
  const user = result.data.find((candidate) =>
    primaryVerifiedEmail(candidate)?.trim().toLowerCase() === email,
  );
  if (!user) {
    if (result.data.length) {
      res.status(400).json({ error: "A conta ainda não confirmou este endereço de e-mail." });
      return;
    }
    res.status(404).json({ error: "A pessoa deve criar e verificar uma conta antes de receber acesso." });
    return;
  }
  if ((user.privateMetadata as Record<string, unknown>).academyOwner === true) {
    const owner = academyTeamMember(user, true);
    if (!owner) {
      res.status(400).json({ error: "Não foi possível validar a conta proprietária." });
      return;
    }
    res.json(AuthorizeAdminTeamMemberResponse.parse(owner));
    return;
  }
  const metadata = user.privateMetadata as Record<string, unknown>;
  const roles = Array.isArray(metadata.academyRoles)
    ? metadata.academyRoles.filter((role): role is string => typeof role === "string")
    : [];
  const updated = await clerkClient.users.updateUserMetadata(user.id, {
    privateMetadata: { ...metadata, academyRoles: [...new Set([...roles, "academy_admin"])] },
  });
  const member = academyTeamMember(updated, false);
  if (!member) {
    res.status(400).json({ error: "A conta precisa de um endereço principal verificado." });
    return;
  }
  res.json(AuthorizeAdminTeamMemberResponse.parse(member));
});

router.delete("/admin/team/:userId", async (req, res): Promise<void> => {
  if (!(await getAcademyOwner(req, res))) return;
  const parsed = RevokeAdminTeamMemberParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Identificador de utilizador inválido." });
    return;
  }
  let user;
  try {
    user = await clerkClient.users.getUser(parsed.data.userId);
  } catch {
    res.status(404).json({ error: "O colaborador não foi encontrado." });
    return;
  }
  const metadata = user.privateMetadata as Record<string, unknown>;
  if (metadata.academyOwner === true) {
    res.status(400).json({ error: "A conta proprietária não pode ser removida." });
    return;
  }
  const roles = Array.isArray(metadata.academyRoles)
    ? metadata.academyRoles.filter((role): role is string => typeof role === "string")
    : [];
  if (!roles.includes("academy_admin") && metadata.academyRole !== "admin") {
    res.status(404).json({ error: "O utilizador não tem acesso administrativo." });
    return;
  }
  await clerkClient.users.updateUserMetadata(user.id, {
    privateMetadata: {
      ...metadata,
      academyRoles: roles.filter((role) => role !== "academy_admin"),
      ...(metadata.academyRole === "admin" ? { academyRole: null } : {}),
    },
  });
  res.status(204).end();
});

router.get("/admin/customers", async (req, res): Promise<void> => {
  if (!(await getAcademyAdmin(req, res))) return;
  const parsed = ListAdminCustomersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "O termo de pesquisa é demasiado longo." });
    return;
  }
  const search = parsed.data.search?.trim();
  const courseFilters = search
    ? or(
        ilike(courseEnrollmentsTable.fullName, `%${search}%`),
        ilike(courseEnrollmentsTable.email, `%${search}%`),
        ilike(courseEnrollmentsTable.phone, `%${search}%`),
        ilike(courseEnrollmentsTable.courseTitle, `%${search}%`),
      )
    : undefined;
  const roomFilters = search
    ? or(
        ilike(roomReservationsTable.name, `%${search}%`),
        ilike(roomReservationsTable.company, `%${search}%`),
        ilike(roomReservationsTable.nif, `%${search}%`),
      )
    : undefined;
  const [enrollments, reservations] = await Promise.all([
    db.select().from(courseEnrollmentsTable)
      .where(courseFilters)
      .orderBy(desc(courseEnrollmentsTable.createdAt)).limit(100),
    db.select().from(roomReservationsTable)
      .where(roomFilters)
      .orderBy(desc(roomReservationsTable.createdAt)).limit(100),
  ]);
  const customers = [
    ...enrollments.map((enrollment) => ({
      id: enrollment.id,
      source: "course" as const,
      name: enrollment.fullName,
      email: enrollment.email,
      phone: enrollment.phone,
      company: null,
      taxId: null,
      item: enrollment.courseTitle,
      date: enrollment.createdAt.toISOString(),
      status: enrollment.paymentStatus,
      amountKz: enrollment.amountKz,
    })),
    ...reservations.map((reservation) => ({
      id: `room-${reservation.id}`,
      source: "room" as const,
      name: reservation.name,
      email: null,
      phone: null,
      company: reservation.company,
      taxId: reservation.nif,
      item: hasRoom(reservation.roomId) ? getRoom(reservation.roomId).name : "Sala",
      date: reservation.bookingDate,
      status: reservation.status,
      amountKz: reservation.priceKz,
    })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 200);
  res.json(ListAdminCustomersResponse.parse(customers));
});

router.get("/admin/media", async (req, res): Promise<void> => {
  if (!(await getAcademyAdmin(req, res))) return;
  const media = await db
    .select()
    .from(academyMediaTable)
    .where(isNull(academyMediaTable.archivedAt))
    .orderBy(desc(academyMediaTable.createdAt));
  res.json(ListAdminMediaResponse.parse(media.map(mediaResult)));
});

router.post("/admin/media", async (req, res): Promise<void> => {
  const admin = await getAcademyAdmin(req, res);
  if (!admin) return;
  const parsed = CreateAdminMediaBody.safeParse(req.body);
  if (!parsed.success || !IMAGE_TYPES.has(parsed.data.contentType) || parsed.data.sizeBytes > MAX_UPLOAD_BYTES) {
    res.status(400).json({ error: "Envie uma imagem JPEG, PNG, WebP ou AVIF até 15 MB." });
    return;
  }
  const input = parsed.data;
  if (input.roomId !== undefined && input.roomId !== null && !hasRoom(input.roomId)) {
    res.status(400).json({ error: "Seleccione uma sala válida para esta imagem." });
    return;
  }
  if (!/^\/objects\/uploads\/[0-9a-f-]{36}$/i.test(input.objectPath)) {
    res.status(400).json({ error: "O caminho da imagem enviada é inválido." });
    return;
  }
  const file = await getAcademyObjectFile(input.objectPath);
  if (!file) {
    res.status(400).json({ error: "O ficheiro enviado não foi encontrado." });
    return;
  }
  const [metadata] = await file.getMetadata();
  const actualSize = Number(metadata.size);
  if (metadata.contentType !== input.contentType || actualSize !== input.sizeBytes || actualSize > MAX_UPLOAD_BYTES) {
    res.status(400).json({ error: "O tipo ou tamanho do ficheiro não corresponde ao envio." });
    return;
  }
  const [media] = await db.insert(academyMediaTable).values({
    title: input.title.trim(),
    altText: input.altText.trim(),
    roomId: input.roomId ?? null,
    objectPath: input.objectPath,
    contentType: input.contentType,
    sizeBytes: actualSize,
    createdBy: admin.userId,
  }).returning();
  await setAcademyObjectVisibility(file, "public", admin.userId);
  res.status(201).json(CreateAdminMediaResponse.parse(mediaResult(media)));
});

router.patch("/admin/media/:id", async (req, res): Promise<void> => {
  if (!(await getAcademyAdmin(req, res))) return;
  const params = UpdateAdminMediaParams.safeParse(req.params);
  const parsed = UpdateAdminMediaBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Identificador ou sala inválidos." });
    return;
  }
  if (parsed.data.roomId !== null && !hasRoom(parsed.data.roomId)) {
    res.status(400).json({ error: "Seleccione uma sala válida para esta imagem." });
    return;
  }
  const [media] = await db.update(academyMediaTable)
    .set({ roomId: parsed.data.roomId })
    .where(and(eq(academyMediaTable.id, params.data.id), isNull(academyMediaTable.archivedAt)))
    .returning();
  if (!media) {
    res.status(404).json({ error: "A imagem activa não foi encontrada." });
    return;
  }
  res.json(UpdateAdminMediaResponse.parse(mediaResult(media)));
});

router.delete("/admin/media/:id", async (req, res): Promise<void> => {
  const admin = await getAcademyAdmin(req, res);
  if (!admin) return;
  const parsed = RemoveAdminMediaParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Identificador de imagem inválido." });
    return;
  }
  const [media] = await db
    .select()
    .from(academyMediaTable)
    .where(and(eq(academyMediaTable.id, parsed.data.id), isNull(academyMediaTable.archivedAt)))
    .limit(1);
  if (!media) {
    res.status(404).json({ error: "A imagem não foi encontrada." });
    return;
  }
  const [usedCourse] = await db
    .select({ id: academyCoursesTable.id })
    .from(academyCoursesTable)
    .where(and(eq(academyCoursesTable.imageUrl, publicMediaUrl(media.objectPath)), isNull(academyCoursesTable.archivedAt)))
    .limit(1);
  if (usedCourse) {
    res.status(400).json({ error: "Altere primeiro a imagem do curso que está a utilizar este ficheiro." });
    return;
  }
  const file = await getAcademyObjectFile(media.objectPath);
  if (file) await setAcademyObjectVisibility(file, "private", admin.userId);
  await db.update(academyMediaTable)
    .set({ archivedAt: new Date() })
    .where(eq(academyMediaTable.id, media.id));
  res.status(204).json(RemoveAdminMediaResponse.parse(undefined));
});

router.get("/admin/agenda", async (req, res): Promise<void> => {
  if (!(await getAcademyAdmin(req, res))) return;
  const parsed = GetAdminAgendaQueryParams.safeParse(req.query);
  if (!parsed.success || !hasRoom(parsed.data.roomId) || !isValidBookingDate(parsed.data.date)) {
    res.status(400).json({ error: "Indique uma sala e uma data válidas." });
    return;
  }
  const { roomId, date } = parsed.data;
  const reservations = await db.select().from(roomReservationsTable)
    .where(and(eq(roomReservationsTable.roomId, roomId), eq(roomReservationsTable.bookingDate, date)))
    .orderBy(roomReservationsTable.startTime);
  res.json(GetAdminAgendaResponse.parse({
    roomId,
    date,
    reservations: reservations.map(adminReservationResult).filter(Boolean),
    blocks: await roomBlocksFor(roomId, date),
  }));
});

router.get("/admin/room-blocks", async (req, res): Promise<void> => {
  if (!(await getAcademyAdmin(req, res))) return;
  const parsed = ListAdminRoomBlocksQueryParams.safeParse(req.query);
  if (!parsed.success || !hasRoom(parsed.data.roomId) || !isValidBookingDate(parsed.data.date)) {
    res.status(400).json({ error: "Indique uma sala e uma data válidas." });
    return;
  }
  res.json(ListAdminRoomBlocksResponse.parse(await roomBlocksFor(parsed.data.roomId, parsed.data.date)));
});

router.post("/admin/room-blocks", async (req, res): Promise<void> => {
  const admin = await getAcademyAdmin(req, res);
  if (!admin) return;
  const parsed = CreateAdminRoomBlockBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Preencha a sala, data, horário e motivo do bloqueio." });
    return;
  }
  const input = parsed.data;
  if (!hasRoom(input.roomId) || !isTodayOrFuture(input.date)
    || !validClockTime(input.startTime) || !validClockTime(input.endTime)
    || timeMinutes(input.startTime) >= timeMinutes(input.endTime)) {
    res.status(400).json({ error: "Indique um período futuro com horários válidos." });
    return;
  }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.roomId}), hashtext(${input.date}))`);
    const conflicts = await tx.select({ startTime: roomReservationsTable.startTime, endTime: roomReservationsTable.endTime })
      .from(roomReservationsTable)
      .where(and(
        eq(roomReservationsTable.roomId, input.roomId),
        eq(roomReservationsTable.bookingDate, input.date),
        eq(roomReservationsTable.status, "confirmed"),
      ));
    const blocks = await tx.select({ startTime: roomAvailabilityBlocksTable.startTime, endTime: roomAvailabilityBlocksTable.endTime })
      .from(roomAvailabilityBlocksTable)
      .where(and(
        eq(roomAvailabilityBlocksTable.roomId, input.roomId),
        eq(roomAvailabilityBlocksTable.bookingDate, input.date),
        isNull(roomAvailabilityBlocksTable.releasedAt),
      ));
    const requested = { startTime: input.startTime, endTime: input.endTime };
    if (conflicts.some((slot) => slotsOverlap(requested, slot)) || blocks.some((slot) => slotsOverlap(requested, slot))) {
      return null;
    }
    const [created] = await tx.insert(roomAvailabilityBlocksTable).values({
      roomId: input.roomId,
      bookingDate: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      reason: input.reason.trim(),
      createdBy: admin.userId,
    }).returning();
    return created;
  });
  if (!result) {
    res.status(409).json({ error: "O período coincide com uma reserva confirmada ou outro bloqueio." });
    return;
  }
  res.status(201).json(CreateAdminRoomBlockResponse.parse({
    id: result.id,
    roomId: result.roomId,
    date: result.bookingDate,
    startTime: result.startTime.slice(0, 5),
    endTime: result.endTime.slice(0, 5),
    reason: result.reason,
    createdAt: result.createdAt,
  }));
});

router.delete("/admin/room-blocks/:id", async (req, res): Promise<void> => {
  const admin = await getAcademyAdmin(req, res);
  if (!admin) return;
  const parsed = ReleaseAdminRoomBlockParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Identificador de bloqueio inválido." });
    return;
  }
  const [released] = await db.update(roomAvailabilityBlocksTable)
    .set({ releasedAt: new Date(), releasedBy: admin.userId })
    .where(and(eq(roomAvailabilityBlocksTable.id, parsed.data.id), isNull(roomAvailabilityBlocksTable.releasedAt)))
    .returning({ id: roomAvailabilityBlocksTable.id });
  if (!released) {
    res.status(404).json({ error: "O período bloqueado não foi encontrado." });
    return;
  }
  res.status(204).end();
});

export default router;
