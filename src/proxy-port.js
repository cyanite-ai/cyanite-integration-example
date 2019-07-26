"use strict";

const envalid = require("envalid");
const ngrok = require("ngrok");

const env = envalid.cleanEnv(process.env, {
  PORT: envalid.num()
});

const WEBHOOK_ROUTE_NAME = "/incoming-webhook";

ngrok.connect(env.PORT).then(url => {
  console.log(`Proxy Webhook Url: ${url}${WEBHOOK_ROUTE_NAME}`);
});
