import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { twiml } from "twilio";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

// Root endpoint
app.get("/", (req, res) => {
  res.send("✅ Flowise-Twilio Voice Agent is running!");
});

// Main voice webhook
app.post("/voice", async (req, res) => {
  const twimlResponse = new twiml.VoiceResponse();
  const callerMessage = req.body.SpeechResult || req.body.Body || "Hello";

  try {
    console.log("Incoming call:", req.body);

    // Flowise API call
    const response = await fetch("https://cloud.flowiseai.com/api/v1/prediction/c7f1f093-e34c-432d-9902-90175f9ed71a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer YOUR_FLOWISE_API_KEY_HERE"
      },
      body: JSON.stringify({ question: callerMessage })
    });

    const data = await response.json();
    const aiReply = data?.text || "Sorry, I had trouble connecting to the AI agent.";

    console.log("AI reply:", aiReply);

    // Twilio voice reply
    twimlResponse.say(aiReply, { voice: "Polly.Joanna" });
  } catch (error) {
    console.error("Error:", error);
    twimlResponse.say("Sorry, there was a problem connecting to the AI agent.");
  }

  res.type("text/xml");
  res.send(twimlResponse.toString());
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
