import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const port = process.env.PORT || 10000;
const flowiseApiUrl = process.env.FLOWISE_API_URL;
const VoiceResponse = twilio.twiml.VoiceResponse;

// ✅ Test route — confirms your app is live
app.get("/", (req, res) => {
  res.send("Flowise Twilio Agent is running ✅");
});

// ✅ Voice route — this is what Twilio calls
app.post("/voice", async (req, res) => {
  const twiml = new VoiceResponse();
  const userSpeech = req.body.SpeechResult || req.body.Body || "Hello";

  try {
    const response = await fetch(flowiseApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: userSpeech }),
    });

    const data = await response.json();
    const answer = data?.text || "Sorry, I couldn’t get that.";

    twiml.say({ voice: "Polly.Joanna" }, answer);
  } catch (err) {
    console.error("Error:", err);
    twiml.say("There was an error processing your request.");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
