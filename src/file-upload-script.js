"use strict";

const fs = require("fs");
const path = require("path");

const envalid = require("envalid");

const fetch = require("node-fetch");
const FormData = require("form-data");

const env = envalid.cleanEnv(process.env, {
  API_URL: envalid.str(),
  ACCESS_TOKEN: envalid.str()
});

const uploadFile = async filePath => {
  //
  // We use the graphql-multipart-request-spec
  // https://github.com/jaydenseric/graphql-multipart-request-spec/tree/v2.0.0
  //
  const mutationDocument = /* GraphQL */ `
    mutation inDepthAnalysisFileUpload($data: InDepthAnalysisFileUploadInput!) {
      inDepthAnalysisFileUpload(data: $data) {
        __typename
        ... on InDepthAnalysisFileUploadSuccessResult {
          inDepthAnalysis {
            id
            status
          }
        }
        ... on Error {
          message
        }
      }
    }
  `;

  const body = new FormData();
  body.append(
    "operations",
    JSON.stringify({
      query: mutationDocument,
      variables: {
        data: {
          file: "0"
        }
      }
    })
  );
  body.append("map", JSON.stringify({ "0": ["variables.data.file"] }));

  const fileStream = fs.createReadStream(filePath);

  body.append("0", fileStream, {
    filename: "my-file.mp3",
    contentType: "audio/mp3"
  });

  console.log("[info] start transferring file");

  const result = await fetch(env.API_URL, {
    method: "POST",
    body,
    headers: {
      Authorization: "Bearer " + env.ACCESS_TOKEN
    }
  }).then(res => res.json());
  console.log("[info] inDepthAnalysisFileUpload response: ");
  console.log(JSON.stringify(result, undefined, 2));
  if (result.errors) {
    throw new Error("Unexpected error occured during the request");
  } else if (
    result.data.inDepthAnalysisFileUpload.__typename !==
    "InDepthAnalysisFileUploadSuccessResult"
  ) {
    throw new Error(result.data.inDepthAnalysisFileUpload.message);
  }
  return result.data;
};

const enqueueAnalysis = async inDepthAnalysisId => {
  const mutationDocument = /* GraphQL */ `
    mutation inDepthAnalysisEnqueueAnalysis(
      $data: InDepthAnalysisEnqueueAnalysisInput!
    ) {
      inDepthAnalysisEnqueueAnalysis(data: $data) {
        __typename
        ... on Error {
          message
        }
        ... on InDepthAnalysisEnqueueAnalysisResultSuccess {
          success
          inDepthAnalysis {
            id
            status
          }
        }
      }
    }
  `;

  const result = await fetch(env.API_URL, {
    method: "POST",
    body: JSON.stringify({
      query: mutationDocument,
      variables: { data: { inDepthAnalysisId } }
    }),
    headers: {
      Authorization: "Bearer " + env.ACCESS_TOKEN,
      "Content-Type": "application/json"
    }
  }).then(res => res.json());
  console.log("[info] inDepthAnalysisEnqueueAnalysis response: ");
  console.log(JSON.stringify(result, undefined, 2));
  if (result.errors) {
    throw new Error("Unexpected error occured during the request");
  } else if (
    result.data.inDepthAnalysisEnqueueAnalysis.__typename !==
    "InDepthAnalysisEnqueueAnalysisResultSuccess"
  ) {
    throw new Error(result.data.inDepthAnalysisFileUpload.message);
  }

  return result.data;
};

const main = async () => {
  console.log(
    await fetch(env.API_URL, {
      method: "POST",
      body: JSON.stringify({
        query: /* GraphQL */ `
          query inDepthAnalysis {
            inDepthAnalyses(first: 10) {
              edges {
                cursor
                node {
                  id
                  title
                }
              }
            }
          }
        `
      }),
      headers: {
        Authorization: "Bearer " + env.ACCESS_TOKEN,
        "Content-Type": "application/json"
      }
    }).then(res => res.json())
  );

  const filePath = path.resolve(__dirname, "piano-sample.mp3");
  const uploadFileResult = await uploadFile(filePath);
  const inDepthAnalysisId =
    uploadFileResult.inDepthAnalysisFileUpload.inDepthAnalysis.id;

  const enqueueAnalysisResult = await enqueueAnalysis(inDepthAnalysisId);

  console.log("done.");
};

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
