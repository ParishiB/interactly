const express = require("express");
const twilio = require("twilio");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.post("/makeCall", (req, res) => {
  const { to } = req.body;
  console.log("Extracted 'to' parameter:", to);

  if (!to) {
    return res.status(400).json({ error: 'The "to" parameter is required' });
  }

  client.calls
    .create({
      url: "https://d1c0-2401-4900-8839-5b40-b5cb-70cf-d5b6-22ac.ngrok-free.app/ivr",
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER,
    })
    .then((call) =>
      res.status(200).json({ message: "Call initiated", callSid: call.sid })
    )
    .catch((err) =>
      res
        .status(500)
        .json({ error: "Failed to initiate call", details: err.message })
    );

  console.log("call sent");
});

app.post("/ivr", (req, res) => {
  const { VoiceResponse } = require("twilio").twiml;

  const twiml = new VoiceResponse();
  twiml.play(
    "https://d1c0-2401-4900-8839-5b40-b5cb-70cf-d5b6-22ac.ngrok-free.app/audio/audio.mp3"
  );

  const gather = twiml.gather({
    numDigits: 1,
    action: "/handleKey",
    method: "POST",
  });

  twiml.redirect("/ivr");

  res.type("text/xml");
  res.send(twiml.toString());
  console.log("call sent p2");
});

app.post("/handleKey", async (req, res) => {
  console.log("req body is", req.body);
  const { Digits, To } = req.body;
  const digit = Digits ? Digits.trim() : "";

  console.log("Received digit:", digit);
  console.log("Received To:", To);

  let twiml = new twilio.twiml.VoiceResponse();

  if (digit === "1") {
    twiml.say(
      "Thank you for your interest. A personalized interview link has been sent to your phone."
    );

    if (!To) {
      console.error("Missing 'to' parameter in request body");
      return res.status(400).json({ error: "Missing 'to' parameter" });
    }

    try {
      const message = await client.messages.create({
        body: "Here is your personalized interview link: https://v.personaliz.ai/?id=9b697c1a&uid=fe141702f66c760d85ab&mode=test",
        to: To,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      console.log(`SMS sent with SID: ${message.sid}`);
    } catch (err) {
      console.error(`Failed to send SMS: ${err.message}`);
      return res.status(500).json({ error: "Failed to send SMS" });
    }
  } else {
    twiml.say("You did not press 1. Goodbye!");
  }

  console.log("call sent p3");
  res.type("text/xml");
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
