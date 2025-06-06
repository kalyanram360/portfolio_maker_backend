import express from "express";
import jsonDataRouter from "./routes/data.router.js";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/json", jsonDataRouter);
export default app;
