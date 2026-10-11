import { Router, type IRouter } from "express";
import healthRouter from "./health";
import roomsRouter from "./rooms";
import authRouter from "./auth";
import courseEnrollmentsRouter from "./course-enrollments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(roomsRouter);
router.use(courseEnrollmentsRouter);
router.use(authRouter);

export default router;
