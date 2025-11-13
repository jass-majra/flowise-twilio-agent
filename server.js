import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  console.log("Body:", req.body);
  next();
});

// Health check
app.get("/", (req, res) => {
  res.send("✅ Flowise Twilio Agent server is live.");
});

// Twilio webhook endpoint
app.post("/voice", async (req, res) => {
  try {
    console.log("🔔 /voice endpoint triggered by Twilio");

    // Respond with basic TwiML to confirm it’s working
    const twimlResponse = `
      <Response>
        <Say voice="alice">Hello! Your Twilio webhook is working perfectly.</Say>
      </Response>
    `;

    res.type("text/xml");
    res.send(twimlResponse);

  } catch (error) {
    console.error("❌ Error in /voice handler:", error);
    res.status(500).send("Internal Server Error");
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
