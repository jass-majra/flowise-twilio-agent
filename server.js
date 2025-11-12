import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Simple test route
app.get("/", (req, res) => {
  res.send("Flowise Twilio Agent is running!");
});

// Twilio voice webhook
app.post("/voice", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("Hello! Your AI receptionist is now active and ready to take calls.");
  res.type("text/xml");
  res.send(twiml.toString());
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
