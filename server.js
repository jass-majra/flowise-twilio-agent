import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch";
import pkg from "twilio";

dotenv.config();
const { twiml } = pkg;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;
const FLOWISE_URL = "https://cloud.flowiseai.com/api/v1/prediction/c7f1f093-e34c-432d-9902-90175f9ed71a";

app.get("/", (req, res) => {
  res.send("✅ Flowise Twilio Agent is running successfully!");
});

app.post("/voice", async (req, res) => {
  console.log("Incoming call request:", req.body);
  const response = new twiml.VoiceResponse();

  try {
    const userMessage = req.body.SpeechResult || req.body.Body || "Hello";

    const flowiseResponse = await fetch(FLOWISE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FLOWISE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: userMessage,
        overrideConfig: { sessionId: req.body.CallSid },
      }),
    });

    const data = await flowiseResponse.json();
    const botReply = data.text || "Sorry, I couldn’t get a response from the AI.";

    response.say({ voice: "Polly.Joanna" }, botReply);
  } catch (error) {
    console.error("Error handling voice request:", error);
    response.say("Sorry, there was a problem connecting to the AI agent.");
  }

  res.type("text/xml");
  res.send(response.toString());
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
