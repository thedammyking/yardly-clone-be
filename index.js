const express = require("express");
const Mailgun = require("mailgun-js");
const bodyParser = require("body-parser");
const stripe = require("stripe")("sk_test_Aq3Ba91kD2B39I64rag2weJT");
const Promise = require("promise");

const api_key = "key-3aa5be89257b26962071476a0d2679ad";
const DOMAIN = "admin.educonsults.org";

const app = express();

app.set("port", process.env.PORT || 5000);

app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/email", (req, res) => {
  let description = " ";
  Promise.all([
    sendMail(api_key, DOMAIN, req.body.email, req.body.message),
    chargeCard(req.body.stripe_token, req.body.amount)
  ])
    .then(result => {
      if (
        result[0].id !== "" &&
        result[0].message === "Queued. Thank you." &&
        result[1].paid === true &&
        result[1].status === "succeeded"
      ) {
        return res.json({ status: true, message: "", data: [] });
      }
      return res.json({ status: false, message: "", data: [] });
    })
    .catch(err => res.json({ ...err }));
});

app.listen(app.get("port"), function() {
  console.log("API is running at localhost:" + app.get("port"));
});

function sendMail(key, domain, email, message) {
  const mailgun = new Mailgun({ apiKey: key, domain: domain });

  const data = {
    from: "Yardly Clone <no-reply@yardly-clone.netlify.com>",
    to: `${email}, pay.p@live.com`,
    subject: "Hello",
    html: message
  };

  return new Promise((resolve, reject) =>
    mailgun.messages().send(data, function(error, body) {
      if (error) reject(error);
      resolve(body);
    })
  );
}

function chargeCard(token, amount, description) {
  return new Promise((resolve, reject) =>
    stripe.charges.create(
      {
        amount: amount * 100,
        currency: "cad",
        source: token,
        capture: true
      },
      function(err, charge) {
        if (err) reject(err);
        resolve(charge);
      }
    )
  );
}
