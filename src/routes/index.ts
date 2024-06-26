import { Router } from "express";
import * as controller from "../controllers/index";

export const index = Router();

index.get("/status", controller.status);

index.get("/livefc", controller.livefc);

index.get("/livefcstreams/:id", controller.livefcstreams);
