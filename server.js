import express from "express";
import pkg from "twilio";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const { twiml } = pkg;
const app = express();

// CRITICAL: Twilio needs BOTH of these to read speech input
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 10000;
const FLOWISE_API_URL = process.env.FLOWISE_API_URL;
const FLOWISE_CHATFLOW_ID = process.env.FLOWISE_CHATFLOW_ID;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

// Query Flowise
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
  return data.text || "Sorry, can you please repeat that?";
}

// Main call logic
app.post("/voice", async (req, res) => {
  const response = new twiml.VoiceResponse();

  // CRITICAL: this must work now
  const userInput = req.body.SpeechResult;
  const caller = req.body.From || "unknown";

  console.log("🗣 Incoming SpeechResult:", userInput);

  if (!userInput) {
    response.say(
      "Thank you for calling Sparkle Car Wash. How can I help you today?",
      { voice: "alice", language: "en-US" }
    );

    response.gather({
      input: "speech",
      action: "/voice",
      method: "POST",
      speechTimeout: "auto",
      timeout: 10,
    });

    res.type("text/xml");
    return res.send(response.toString());
  }

  try {
    const aiReply = await queryFlowise(userInput, caller);

    response.say(aiReply, { voice: "alice", language: "en-US" });

    response.gather({
      input: "speech",
      action: "/voice",
      method: "POST",
      speechTimeout: "auto",
      timeout: 10,
    });

  } catch (err) {
    console.error("Flowise error:", err);
    response.say("Sorry, I am having trouble connecting right now.");
  }

  res.type("text/xml");
  res.send(response.toString());
});

// For testing
app.get("/", (req, res) => {
  res.send("Server is running.");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
