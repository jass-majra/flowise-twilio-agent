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

// ---------------------------
// Query Flowise (WITH correct payload)
// ---------------------------
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
        sessionId: sessionId
      }
    }),
  });

  const data = await response.json();

  // Flowise cloud uses "response" instead of "text" sometimes
  const reply =
    data.text ||
    data.response ||
    data.answer ||
    "Sorry, I didn’t catch that.";

  return reply;
}

// ---------------------------
// TWILIO VOICE ROUTE
// ---------------------------
app.post("/voice", async (req, res) => {
  const response = new twiml.VoiceResponse();
  const speech = req.body.SpeechResult;
  const caller = req.body.From || "anonymous";

  // FIRST CALL: no speech yet
  if (!speech) {
    response.say(
      "Thank you for calling Sparkle Car Wash. How can I help you today?",
      { voice: "alice", language: "en-US" }
    );

    response.gather({
      input: "speech",
      action: "/voice",
      method: "POST",
      timeout: 8,
    });

    res.type("text/xml");
    return res.send(response.toString());
  }

  // USER SAID SOMETHING → SEND TO FLOWISE
  try {
    const aiReply = await queryFlowise(speech, caller);

    response.say(aiReply, { voice: "alice", language: "en-US" });

    response.gather({
      input: "speech",
      action: "/voice",
      method: "POST",
      timeout: 8,
    });

  } catch (err) {
    console.error("Flowise error:", err);

    response.say(
      "Sorry, I am having trouble accessing the system right now.",
      { voice: "alice", language: "en-US" }
    );
  }

  res.type("text/xml");
  res.send(response.toString());
});

// ---------------------------
// ROOT URL
// ---------------------------
app.get("/", (req, res) => {
  res.send("Flowise–Twilio phone bot is running.");
});

// ---------------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
