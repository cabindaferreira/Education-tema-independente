import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { and, count, eq, isNull } from "drizzle-orm";
import { academyCoursesTable, academyMediaTable, db, pool } from "@workspace/db";
import {
  createObjectPath,
  createUploadUrl,
  getAcademyObjectFile,
  setAcademyObjectVisibility,
} from "../lib/object-storage";

const importerId = "system:initial-static-media-import";
const imagesRoot = resolve(process.cwd(), "../education-theme/public/images");

const mediaItems = [
  { file: "courses/crm.jpg", title: "Estágio Formativo em CRM", altText: "Imagem do curso de CRM.", courseId: "crm" },
  { file: "courses/tesouraria.jpg", title: "Estágio Formativo em Tesouraria", altText: "Imagem do curso de Tesouraria.", courseId: "tesouraria" },
  { file: "courses/lideranca-equipas.jpg", title: "Liderança e Gestão de Equipas", altText: "Imagem do curso de Liderança e Gestão de Equipas.", courseId: "lideranca-equipas" },
  { file: "courses/gestao-empresas.jpg", title: "Gestão e Administração de Empresas", altText: "Imagem do curso de Gestão e Administração de Empresas.", courseId: "gestao-empresas" },
  { file: "courses/recursos-humanos.jpg", title: "Gestão de Recursos Humanos", altText: "Imagem do curso de Gestão de Recursos Humanos.", courseId: "recursos-humanos" },
  { file: "courses/gestao-comercial.jpg", title: "Estágio Formativo em Gestão Comercial", altText: "Imagem do curso de Gestão Comercial.", courseId: "gestao-comercial" },
  { file: "rooms/sala-soba.jpg", title: "Sala Soba", altText: "Fotografia da Sala Soba.", roomId: "sala-soba" as const },
  { file: "rooms/sala-kilamba.jpg", title: "Sala Kilamba", altText: "Fotografia da Sala Kilamba.", roomId: "sala-kilamba" as const },
  { file: "rooms/sala-kudi.jpg", title: "Sala Kudi", altText: "Fotografia da Sala Kudi.", roomId: "sala-kudi" as const },
  { file: "rooms/sala-ondjango.jpg", title: "Sala Ondjango", altText: "Fotografia da Sala Ondjango.", roomId: "sala-ondjango" as const },
  { file: "academia-hero.jpg", title: "Banner principal da Academia", altText: "Imagem principal da Academia Procenter." },
  { file: "education-banner-bg.jpg", title: "Banner de formação", altText: "Imagem de fundo para conteúdos de formação." },
];

async function main() {
  let imported = 0;
  let linkedCourses = 0;

  for (const item of mediaItems) {
    const sourcePath = `/images/${item.file}`;
    const sourceBytes = await readFile(resolve(imagesRoot, item.file));
    const existingRows = await db
      .select()
      .from(academyMediaTable)
      .where(and(
        eq(academyMediaTable.createdBy, importerId),
        eq(academyMediaTable.title, item.title),
        isNull(academyMediaTable.archivedAt),
      ))
      .limit(1);

    let media = existingRows[0];
    if (!media) {
      const objectPath = createObjectPath();
      const uploadUrl = await createUploadUrl(objectPath);
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: new Uint8Array(sourceBytes),
      });
      if (!response.ok) {
        throw new Error(`Upload falhou para ${item.file} (HTTP ${response.status}).`);
      }

      const objectFile = await getAcademyObjectFile(objectPath);
      if (!objectFile) throw new Error(`O ficheiro ${item.file} não apareceu no armazenamento.`);
      const [metadata] = await objectFile.getMetadata();
      if (metadata.contentType !== "image/jpeg" || Number(metadata.size) !== sourceBytes.byteLength) {
        await objectFile.delete({ ignoreNotFound: true });
        throw new Error(`A validação do ficheiro ${item.file} falhou.`);
      }
      await setAcademyObjectVisibility(objectFile, "public", importerId);

      try {
        [media] = await db.insert(academyMediaTable).values({
          title: item.title,
          altText: item.altText,
          roomId: "roomId" in item ? item.roomId : null,
          objectPath,
          contentType: "image/jpeg",
          sizeBytes: sourceBytes.byteLength,
          createdBy: importerId,
        }).returning();
      } catch (error) {
        await objectFile.delete({ ignoreNotFound: true }).catch(() => undefined);
        throw error;
      }
      imported += 1;
    }

    if ("courseId" in item) {
      const [course] = await db
        .select({ imageUrl: academyCoursesTable.imageUrl })
        .from(academyCoursesTable)
        .where(and(eq(academyCoursesTable.id, item.courseId), isNull(academyCoursesTable.archivedAt)))
        .limit(1);
      if (course?.imageUrl === sourcePath) {
        await db.update(academyCoursesTable)
          .set({ imageUrl: `/api/storage${media.objectPath}`, updatedAt: new Date() })
          .where(eq(academyCoursesTable.id, item.courseId));
        linkedCourses += 1;
      }
    }

    console.log(`${media.title}: ${media.objectPath}`);
  }

  const [activeCount] = await db
    .select({ count: count() })
    .from(academyMediaTable)
    .where(isNull(academyMediaTable.archivedAt));
  console.log(JSON.stringify({
    imported,
    linkedCourses,
    importedRoomPhotos: mediaItems.filter((item) => "roomId" in item).length,
    activeMediaCountAtLeast: activeCount?.count ?? 0,
  }));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Importação de mídias falhou.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
