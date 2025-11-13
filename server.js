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
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY || "";

// Helper function to query Flowise
async function queryFlowise(userInput) {
  const response = await fetch(`${FLOWISE_API_URL}/${FLOWISE_CHATFLOW_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(FLOWISE_API_KEY ? { Authorization: `Bearer ${FLOWISE_API_KEY}` } : {}),
    },
    body: JSON.stringify({ question: userInput }),
  });

  const data = await response.json();
  return data?.text || "I'm sorry, could you please repeat that?";
}

// Main voice route
app.post("/voice", async (req, res) => {
  const twimlResponse = new twiml.VoiceResponse();
  const userInput = req.body.SpeechResult || req.body.Body;

  if (!userInput) {
    // Initial greeting
    twimlResponse.say("Hello! This is your AI assistant. How can I help you today?", {
      voice: "alice",
      language: "en-US",
    });
    // Wait 15 seconds for user to respond
    twimlResponse.gather({
      input: "speech",
      action: "/voice",
      method: "POST",
      timeout: 15,
    });
  } else {
    try {
      // Send user's speech to Flowise
      const aiResponse = await queryFlowise(userInput);
      twimlResponse.say(aiResponse, { voice: "alice", language: "en-US" });
      // Keep conversation going, wait 15s for next response
      twimlResponse.gather({
        input: "speech",
        action: "/voice",
        method: "POST",
        timeout: 15,
      });
    } catch (err) {
      console.error("Error contacting Flowise:", err);
      twimlResponse.say("Sorry, there was a problem connecting to the AI agent.");
    }
  }

  res.type("text/xml");
  res.send(twimlResponse.toString());
});

app.get("/", (req, res) => {
  res.send("✅ Flowise Twilio Agent is running and listening for calls");
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
