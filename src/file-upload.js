"use strict";

const envalid = require("envalid");
const fs = require("fs");
const fetch = require("node-fetch");
const FormData = require("form-data");

const { API_URL, ACCESS_TOKEN } = envalid.cleanEnv(process.env, {
  API_URL: envalid.str(),
  ACCESS_TOKEN: envalid.str()
});

const uploadFile = async filePath => {
  const mutationDocument = /* GraphQL */ `
    mutation inDepthAnalysisFileUpload(
      $input: InDepthAnalysisFileUploadInput!
    ) {
      inDepthAnalysisFileUpload(data: $input) {
        __typename
        ... on InDepthAnalysisFileUploadSuccessResult {
          inDepthAnalysis {
            id
            title
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
        input: {
          file: "0"
        }
      }
    })
  );
  body.append("map", JSON.stringify({ "0": ["variables.input.file"] }));
  const fileStream = fs.createReadStream(filePath);

  body.append("0", fileStream, {
    filename: "my-uploaded-file.mp3",
    contentType: "audio/mp3"
  });

  console.log("[info] start transferring file");

  const result = await fetch(API_URL, {
    method: "POST",
    body,
    headers: {
      Authorization: "Bearer " + ACCESS_TOKEN
    }
  }).then(res => res.json());
  console.log("[info] inDepthAnalysisFileUpload response: ");
  console.log(JSON.stringify(result, undefined, 2));

  if (result.data.inDepthAnalysisFileUpload.__typename.endsWith("Error")) {
    throw new Error(result.data.inDepthAnalysisFileUpload.message);
  }

  return result.data;
};

const main = async filePath => {
  await uploadFile(filePath);
};

main(process.argv[2]).catch(err => {
  console.error(err);
  process.exitCode = 1;
});
