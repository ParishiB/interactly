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

app.post("/makeCall", (req, res) => {
  console.log("Received request");
  console.log("Request body:", req.body);

  const { to } = req.body;
  console.log("Extracted 'to' parameter:", to);

  if (!to) {
    return res.status(400).json({ error: 'The "to" parameter is required' });
  }

  client.calls
    .create({
      url: "https://43c0-2401-4900-8838-5d60-cc27-d619-b89a-b28f.ngrok-free.app/ivr",
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
});

// app.post("/ivr", (req, res) => {
//   const twiml = new _twiml.VoiceResponse();

//   twiml.play("https://your-server.com/audio.mp3");
//   twiml
//     .gather({
//       numDigits: 1,
//       action: "/handleKey",
//       method: "POST",
//     })
//     .say("Press 1 if you are interested.");

//   res.type("text/xml");
//   res.send(twiml.toString());
// });
app.post("/ivr", (req, res) => {
  const { VoiceResponse } = require("twilio").twiml;

  const twiml = new VoiceResponse();
  twiml.play(
    "https://43c0-2401-4900-8838-5d60-cc27-d619-b89a-b28f.ngrok-free.app/audio/audio.mp3"
  );

  const gather = twiml.gather({
    numDigits: 1,
    action: "/handleKey",
    method: "POST",
  });

  gather.say("Press 1 if you are interested.");

  twiml.redirect("/ivr");

  res.type("text/xml");
  res.send(twiml.toString());
});

app.post("/handleKey", (req, res) => {
  const digit = req.body.Digits;
  const twiml = new _twiml.VoiceResponse();

  if (digit === "1") {
    twiml.say(
      "Thank you for your interest. A personalized interview link has been sent to your phone."
    );

    client.messages
      .create({
        body: "Here is your personalized interview link: https://v.personaliz.ai/?id=9b697c1a&uid=fe141702f66c760d85ab&mode=test",
        to: req.body.From,
        from: process.env.TWILIO_PHONE_NUMBER,
      })
      .then((message) => console.log(`SMS sent with SID: ${message.sid}`))
      .catch((err) => console.error(`Failed to send SMS: ${err.message}`));
  } else {
    twiml.say("You did not press 1. Goodbye!");
  }

  res.type("text/xml");
  res.send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
