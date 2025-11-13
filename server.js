import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio Voice Webhook
app.post("/voice", async (req, res) => {
  try {
    const twimlResponse = `
      <Response>
        <Say voice="alice">Hello! Your AI receptionist is now connected successfully.</Say>
      </Response>
    `;
    res.type("text/xml");
    res.send(twimlResponse);
  } catch (error) {
    console.error("Error handling /voice:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("Flowise Twilio Agent is running!");
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
