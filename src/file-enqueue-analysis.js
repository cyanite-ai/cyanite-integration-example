"use strict";

const envalid = require("envalid");
const fetch = require("node-fetch");

const { API_URL, ACCESS_TOKEN } = envalid.cleanEnv(process.env, {
  API_URL: envalid.str(),
  ACCESS_TOKEN: envalid.str()
});

const inDepthAnalysisEnqueueAnalysis = async inDepthAnalysisId => {
  const mutationDocument = /* GraphQL */ `
    mutation inDepthAnalysisEnqueueAnalysis(
      $input: InDepthAnalysisEnqueueAnalysisInput!
    ) {
      inDepthAnalysisEnqueueAnalysis(data: $input) {
        __typename
        ... on InDepthAnalysisEnqueueAnalysisResultSuccess {
          success
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
  const result = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      query: mutationDocument,
      variables: { input: { inDepthAnalysisId } }
    }),
    headers: {
      Authorization: "Bearer " + ACCESS_TOKEN,
      "Content-Type": "application/json"
    }
  }).then(res => res.json());
  console.log("[info] inDepthAnalysisEnqueueAnalysis response: ");
  console.log(JSON.stringify(result, undefined, 2));
  if (result.data.inDepthAnalysisEnqueueAnalysis.__typename.endsWith("Error")) {
    throw new Error(result.data.inDepthAnalysisFileUpload.message);
  }

  return result.data;
};

const main = async inDepthAnalysisId => {
  await inDepthAnalysisEnqueueAnalysis(inDepthAnalysisId);
};

main(process.argv[2]).catch(err => {
  console.error(err);
  process.exitCode = 1;
});
