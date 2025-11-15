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
  return data.text || "Sorry, I did not understand that.";
}

// Handle calls
app.post("/voice", async (req, res) => {
  const r = new twiml.VoiceResponse();
  const speech = req.body.SpeechResult;
  const caller = req.body.From || "unknown";

  if (!speech) {
    // First greeting
    r.say("Thank you for calling Sparkle Car Wash. How can I help you today?", {
      voice: "alice",
      language: "en-US"
    });

    const gather = r.gather({
      input: "speech",
      speechModel: "phone_call",
      speechTimeout: "auto",
      action: "/voice",
      method: "POST"
    });

    return res.type("text/xml").send(r.toString());
  }

  try {
    const aiReply = await queryFlowise(speech, caller);

    r.say(aiReply, { voice: "alice", language: "en-US" });

    r.gather({
      input: "speech",
      speechModel: "phone_call",
      speechTimeout: "auto",
      action: "/voice",
      method: "POST"
    });

  } catch (err) {
    console.error("Flowise error:", err);
    r.say("Sorry, my system is having trouble right now.");
  }

  res.type("text/xml");
  res.send(r.toString());
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
