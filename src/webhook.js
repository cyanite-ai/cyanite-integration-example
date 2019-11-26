"use strict";

const crypto = require("crypto");
const envalid = require("envalid");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fetch = require("node-fetch");

const env = envalid.cleanEnv(process.env, {
  PORT: envalid.num(),
  SECRET: envalid.str(),
  ACCESS_TOKEN: envalid.str()
});

const isSignatureValid = (secret, signature, message) => {
  const hmac = crypto.createHmac("sha512", secret);
  hmac.write(message);
  hmac.end();
  const compareSignature = hmac.read().toString("hex");
  return signature === compareSignature;
};

const WEBHOOK_ROUTE_NAME = "/incoming-webhook";

const asynchronouslyFetchInDepthAnalysisResult = async inDepthAnalysisId => {
  // fetch the whole information
  const inDepthAnalysisQueryDocument = /* GraphQL */ `
    query inDepthAnalysis($inDepthAnalysisId: ID!) {
      inDepthAnalysis(recordId: $inDepthAnalysisId) {
        __typename
        ... on InDepthAnalysis {
          id
          status
          result {
            fileInfo {
              duration
            }
            labels {
              title
              type
              start
              end
              amount
            }
            genres {
              title
              confidence
            }
            similarLibraryTracks {
              ... on SimilarLibraryTrackConnection {
                edges {
                  node {
                    distance
                    sort
                    inDepthAnalysisId
                  }
                }
              }
            }
          }
        }
        ... on Error {
          message
        }
      }
    }
  `;

  const result = await fetch(env.API_URL, {
    method: "POST",
    body: JSON.stringify({
      query: inDepthAnalysisQueryDocument,
      variables: { inDepthAnalysisId }
    }),
    headers: {
      Authorization: "Bearer " + env.ACCESS_TOKEN,
      "Content-Type": "application/json"
    }
  }).then(res => res.json());
  console.log("[info] inDepthAnalysis result");
  console.log(JSON.stringify(result, undefined, 2));
};

app.use(bodyParser.json());
app.post(WEBHOOK_ROUTE_NAME, (req, res) => {
  if (!req.body) {
    return res.sendStatus(422); // Unprocessable Entity
  }

  console.log("[info] incoming event:");
  console.log(JSON.stringify(req.body, undefined, 2));

  if (req.body.type === "TEST") {
    console.log("[info] processing test event");
    return res.sendStatus(200);
  }

  // verifying the request signature is not required but recommended
  // by verifying the signature you can ensure the incoming request was sent by Cyanite.ai
  if (
    !isSignatureValid(
      env.SECRET,
      req.headers.signature,
      JSON.stringify(req.body)
    )
  ) {
    console.log("[info] signature is invalid");
    return res.sendStatus(400);
  }
  console.log("[info] signature is valid");

  if (req.body.type === "IN_DEPTH_ANALYSIS_FINISHED") {
    console.log("[info] processing finish event");

    // You can use the result here, but keep in mind that you should probably process the result asynchronously
    // The request of the incoming webhook will be canceled after 3 seconds.
    asynchronouslyFetchInDepthAnalysisResult(req.body.data.inDepthAnalysisId);
  }

  // Do something with the result here

  return res.sendStatus(200);
});

app.listen(env.PORT, () => {
  console.log(
    `Server listening on http://localhost:${env.PORT}${WEBHOOK_ROUTE_NAME}`
  );
});
