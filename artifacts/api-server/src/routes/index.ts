import { Router, type IRouter } from "express";
import healthRouter from "./health";
import roomsRouter from "./rooms";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(roomsRouter);
router.use(authRouter);

export default router;
