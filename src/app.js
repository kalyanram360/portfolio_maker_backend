import express from "express";
import jsonDataRouter from "./routes/data.router.js";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/json", jsonDataRouter);

app.post("/whatsapp/reply", (req, res) => {
  const from = req.body.From; // sender's WhatsApp number
  const body = req.body.Body; // message text

  console.log(`📩 Message received from ${from}: ${body}`);

  // Respond with 200 OK (Twilio expects a response)
  res.send("Message received ✅");
});
export default app;
