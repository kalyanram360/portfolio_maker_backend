import { Router } from "express";
import jsonDataHandler from "../controlers/data.controler.js";
import imageDataHandler from "../controlers/cloudinary.controler.js";
import githubauth from "../controlers/githubaccess.js";
import deployment from "../controlers/deployment.controler.js";

const router = Router();

router.post("/data", jsonDataHandler);
router.post("/image", imageDataHandler);
router.get("/deploy", githubauth);
router.post("/deployy", deployment);

export default router;
