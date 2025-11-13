import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Twilio VoiceResponse helper
const { VoiceResponse } = twilio.twiml;

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("✅ Flowise Twilio AI Agent is running");
});

// ✅ Main voice endpoint
app.post("/voice", async (req, res) => {
  console.log("📞 Incoming call:", req.body);
  const twiml = new VoiceResponse();

  try {
    // Step 1: Capture caller speech or fallback
    const question = req.body.SpeechResult || "Hello, can you help me?";

    // Step 2: Call Flowise API (replace YOUR_FLOWISE_API_URL below)
    const flowiseResponse = await fetch("https://YOUR-FLOWISE-URL/api/v1/prediction/YOUR_CHATFLOW_ID", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: question,
        history: [],
      }),
    });

    const data = await flowiseResponse.json();
    console.log("🤖 Flowise reply:", data);

    // Step 3: Get AI reply text
    const aiReply = data.text || "Sorry, I didn’t understand that.";

    // Step 4: Speak back to caller
    twiml.say(aiReply, { voice: "Polly.Joanna" }); // You can change to "Polly.Matthew" etc.
  } catch (error) {
    console.error("❌ Error:", error);
    twiml.say("Sorry, there was a problem connecting to the AI agent.");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
