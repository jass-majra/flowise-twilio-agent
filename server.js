import express from "express";
import pkg from "twilio";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
const { twiml } = pkg;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = process.env.PORT || 10000;
const FLOWISE_API_URL = process.env.FLOWISE_API_URL;
const FLOWISE_CHATFLOW_ID = process.env.FLOWISE_CHATFLOW_ID;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

// Send user message to Flowise
async function queryFlowise(userInput, sessionId) {
  const url = `${FLOWISE_API_URL}/${FLOWISE_CHATFLOW_ID}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FLOWISE_API_KEY}`,
    },
    body: JSON.stringify({
      question: userInput,
      overrideConfig: {
        sessionId: sessionId, 
      }
    }),
  });

  const data = await response.json();
  return data.text || "Sorry, can you say that again?";
}

// Main call logic
app.post("/voice", async (req, res) => {
  const response = new twiml.VoiceResponse();
  const userInput = req.body.SpeechResult;
  const caller = req.body.From || "unknown";

  if (!userInput) {
    response.say(
      "Thank you for calling Sparkle Car Wash. How can I help you today?",
      { voice: "alice", language: "en-US" }
    );

    response.gather({
      input: "speech",
      action: "/voice",
      method: "POST",
      timeout: 8,
      speechTimeout: "auto",
      language: "en-US"
    });

  } else {
    try {
      const aiReply = await queryFlowise(userInput, caller);

      response.say(aiReply, { voice: "alice", language: "en-US" });

      response.gather({
        input: "speech",
        action: "/voice",
        method: "POST",
        timeout: 8,
        speechTimeout: "auto",
        language: "en-US"
      });

    } catch (err) {
      console.error("Flowise error:", err);
      response.say("Sorry, my system is having trouble right now.");
    }
  }

  res.type("text/xml");
  res.send(response.toString());
});

app.get("/", (req, res) => {
  res.send("Flowise + Twilio agent running.");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
