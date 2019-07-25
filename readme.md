# Cyanite.ai Integration Example App

This example app showcases how you can integrate the Cyanite.ai API into your own application.

## Prerequisites

Before getting started you will need to create an integration over at https://app.cyanite.ai/integrations

You need the following:

- Access Token
- Webhook Secret

After receiving these copy `.env.sample` to `.env` and adjust the values.

Then you can install the dependencies using either `yarn install` (or `npm install`).

## Starting the webhook listener

run `yarn start` (or `npm start`)

Wait until you see the following output (in case your port is already in use you will have to configure the port inside your `.env` file.)

The script uses [`ngrok.io`](https://ngrok.io) for exposing the port to the internet. This allows to make the webhook accessible from the Cyanite.ai servers for development purposes. In production environment you should not rely on ngrok.io but rather have a public facing server/service.

```
yarn run v1.15.2
$ node src/webhook.js
Server listening on http://localhost:8080/incoming-webhook
Server listening on https://f288XXXX.ngrok.io/incoming-webhook
```

Copy the ngrok.io url and update your Cyanite.ai Integration Webhook Url to the given value. (You can use the test button to ensure that the requests arrive).

## Enqueueing a new file analysis

Run the `src/file-upload-script.js` using `yarn upload-file` (or `npm run upload-file`).
The script will upload a file and enqueue an analysis. After a few seconds you should be able to see some output in the terminal of the webhook server.

## Further References

- [Cyanite.ai Public GraphQL API](https://app.cyanite.ai/api-docs)
