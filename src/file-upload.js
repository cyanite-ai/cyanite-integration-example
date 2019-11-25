"use strict";

const envalid = require("envalid");
const fs = require("fs");
const fetch = require("node-fetch");

const { API_URL, ACCESS_TOKEN } = envalid.cleanEnv(process.env, {
  API_URL: envalid.str(),
  ACCESS_TOKEN: envalid.str()
});

const fileUploadRequestMutation = /* GraphQL */ `
  mutation fileUploadRequest {
    fileUploadRequest {
      id
      uploadUrl
    }
  }
`;

const inDepthAnalysisCreateMutation = /* GraphQL */ `
  mutation inDepthAnalysisCreate($data: InDepthAnalysisCreateInput!) {
    inDepthAnalysisCreate(data: $data) {
      __typename
      ... on InDepthAnalysisCreateResultSuccess {
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

const requestFileUpload = async () => {
  const result = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      query: fileUploadRequestMutation
    }),
    headers: {
      Authorization: "Bearer " + ACCESS_TOKEN,
      "Content-Type": "application/json"
    }
  }).then(res => res.json());

  console.log("[info] fileUploadRequest response: ");
  console.log(JSON.stringify(result, undefined, 2));

  return result.data.fileUploadRequest;
};

const uploadFile = async (filePath, uploadUrl) => {
  const result = await fetch(uploadUrl, {
    method: "PUT",
    body: fs.createReadStream(filePath),
    headers: {
      "Content-Length": fs.statSync(filePath).size
    }
  }).then(res => res.text());
  console.log(result);
};

const createInDepthAnalysis = async fileUploadRequestId => {
  const result = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      query: inDepthAnalysisCreateMutation,
      variables: {
        data: {
          fileName: "My first InDepthAnalysis",
          uploadId: fileUploadRequestId
        }
      }
    }),
    headers: {
      Authorization: "Bearer " + ACCESS_TOKEN,
      "Content-Type": "application/json"
    }
  }).then(res => res.json());

  console.log("[info] inDepthAnalysisCreate response: ");
  console.log(JSON.stringify(result, undefined, 2));

  return result.data.inDepthAnalysisCreate;
};

const main = async filePath => {
  console.log("[info] request file upload");
  const { id, uploadUrl } = await requestFileUpload(filePath);
  console.log(uploadUrl);

  console.log("[info] upload file");
  await uploadFile(filePath, uploadUrl);
  console.log("[info] create InDepthAnalysis");
  await createInDepthAnalysis(id);
};

main(process.argv[2]).catch(err => {
  console.error(err);
  process.exitCode = 1;
});
