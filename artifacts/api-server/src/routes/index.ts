import { Router, type IRouter } from "express";
import healthRouter from "./health";
import roomsRouter from "./rooms";
import authRouter from "./auth";
import courseEnrollmentsRouter from "./course-enrollments";
import courseEnrollmentRequestsRouter from "./course-enrollment-requests";
import newsletterRouter from "./newsletter";
import adminRouter from "./admin";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(roomsRouter);
router.use(courseEnrollmentsRouter);
router.use(courseEnrollmentRequestsRouter);
router.use(authRouter);
router.use(newsletterRouter);
router.use(adminRouter);
router.use(storageRouter);

export default router;
