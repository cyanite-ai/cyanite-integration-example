"use strict";

const envalid = require("envalid");
const fetch = require("node-fetch");

const { API_URL, ACCESS_TOKEN } = envalid.cleanEnv(process.env, {
  API_URL: envalid.str(),
  ACCESS_TOKEN: envalid.str()
});

const libraryTrackEnqueue = async libraryTrackId => {
  const mutationDocument = /* GraphQL */ `
    mutation LibraryTrackEnqueue($input: LibraryTrackEnqueueInput!) {
      libraryTrackEnqueue(input: $input) {
        __typename
        ... on LibraryTrackEnqueueError {
          message
        }
        ... on LibraryTrackEnqueueSuccess {
          enqueuedLibraryTrack {
            id
          }
        }
      }
    }
  `;
  const result = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      query: mutationDocument,
      variables: { input: { libraryTrackId } }
    }),
    headers: {
      Authorization: "Bearer " + ACCESS_TOKEN,
      "Content-Type": "application/json"
    }
  }).then(res => res.json());
  console.log("[info] libraryTrackEnqueue response: ");
  console.log(JSON.stringify(result, undefined, 2));
  if (result.data.libraryTrackEnqueue.__typename.endsWith("Error")) {
    throw new Error(result.data.inDepthAnalysisFileUpload.message);
  }

  return result.data;
};

const main = async libraryTrackId => {
  await libraryTrackEnqueue(libraryTrackId);
};

main(process.argv[2]).catch(err => {
  console.error(err);
  process.exitCode = 1;
});
