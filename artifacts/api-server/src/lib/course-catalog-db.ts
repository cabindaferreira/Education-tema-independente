import { db, academyCoursesTable } from "@workspace/db";
import { COURSE_CATALOG } from "./course-catalog";

export async function ensureDefaultAcademyCourses(): Promise<void> {
  const defaults = Object.entries(COURSE_CATALOG).map(([id, course]) => ({
    id,
    title: course.title,
    description: course.description,
    duration: course.duration,
    priceKz: course.priceKz,
    imageUrl: course.imageUrl,
    published: true,
    enrollmentOpen: true,
  }));

  for (const course of defaults) {
    await db.insert(academyCoursesTable).values(course).onConflictDoNothing();
  }
}
