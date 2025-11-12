import express from "express";
import axios from "axios";
import twilio from "twilio";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const FLOWISE_API_URL = process.env.FLOWISE_API_URL; 
const TWILIO_NUMBER = process.env.TWILIO_NUMBER;

// Handle incoming Twilio calls
app.post("/call", async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("Hi! This is your car wash assistant. How can I help you today?");
  twiml.gather({
    input: "speech",
    action: "/process",
    method: "POST"
  });
  res.type("text/xml");
  res.send(twiml.toString());
});

// Handle spoken response
app.post("/process", async (req, res) => {
  const speechResult = req.body.SpeechResult || "";
  const twiml = new twilio.twiml.VoiceResponse();

  try {
    const response = await axios.post(FLOWISE_API_URL, {
      question: speechResult
    });
    const answer = response.data.text || "Sorry, I didn’t catch that.";
    twiml.say(answer);
  } catch (error) {
    console.error("Flowise error:", error.message);
    twiml.say("There was a problem reaching the AI service.");
  }

  twiml.hangup();
  res.type("text/xml");
  res.send(twiml.toString());
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
