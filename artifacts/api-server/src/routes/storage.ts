import { and, eq, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { RequestAdminMediaUploadUrlBody, RequestAdminMediaUploadUrlResponse } from "@workspace/api-zod";
import { academyMediaTable, db } from "@workspace/db";
import { getAcademyAdmin } from "../lib/admin-auth";
import {
  createObjectPath,
  createUploadUrl,
  getAcademyObjectFile,
  isAcademyObjectPublic,
} from "../lib/object-storage";

const router: IRouter = Router();

router.post("/storage/uploads/request-url", async (req, res): Promise<void> => {
  if (!(await getAcademyAdmin(req, res))) return;
  const parsed = RequestAdminMediaUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Envie uma imagem JPEG, PNG, WebP ou AVIF até 15 MB." });
    return;
  }
  try {
    const objectPath = createObjectPath();
    const uploadUrl = await createUploadUrl(objectPath);
    res.json(RequestAdminMediaUploadUrlResponse.parse({
      uploadUrl,
      objectPath,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    }));
  } catch (error) {
    req.log.error({ err: error }, "Academy media upload URL creation failed");
    res.status(503).json({ error: "O armazenamento de mídias não está disponível." });
  }
});

router.get("/storage/objects/*path", async (req, res): Promise<void> => {
  const wildcardPath = req.params.path;
  const objectPath = `/objects/${Array.isArray(wildcardPath) ? wildcardPath.join("/") : wildcardPath}`;
  const [media] = await db.select({ objectPath: academyMediaTable.objectPath })
    .from(academyMediaTable)
    .where(and(eq(academyMediaTable.objectPath, objectPath), isNull(academyMediaTable.archivedAt)))
    .limit(1);
  if (!media) {
    res.status(404).end();
    return;
  }

  try {
    const file = await getAcademyObjectFile(objectPath);
    if (!file || !(await isAcademyObjectPublic(file))) {
      res.status(404).end();
      return;
    }
    const [metadata] = await file.getMetadata();
    if (!String(metadata.contentType ?? "").startsWith("image/")) {
      res.status(404).end();
      return;
    }
    res.setHeader("Content-Type", String(metadata.contentType));
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
    if (metadata.size) res.setHeader("Content-Length", String(metadata.size));
    const stream = file.createReadStream();
    stream.on("error", (error) => {
      req.log.warn({ err: error }, "Academy media object stream failed");
      if (res.headersSent) res.destroy(error);
      else res.status(404).end();
    });
    stream.pipe(res);
  } catch (error) {
    req.log.warn({ err: error }, "Academy media object could not be served");
    if (!res.headersSent) res.status(404).end();
  }
});

export default router;
