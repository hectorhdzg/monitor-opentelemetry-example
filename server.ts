// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as api from "@opentelemetry/api";
import { EventHubProducerClient } from "@azure/event-hubs";
import { DefaultAzureCredential } from "@azure/identity";

import { getOpenTelemetryTracer, initializeApplicationInsights } from "./tracer";

// Load the .env file if it exists
import * as dotenv from "dotenv";
dotenv.config();

/*********************************************************************
 * APPLICATION INSIGHTS SETUP
 **********************************************************************/
initializeApplicationInsights();

/*********************************************************************
 *  OPEN TELEMETRY SETUP
 **********************************************************************/
const tracer = getOpenTelemetryTracer();
// Open Telemetry setup need to happen before instrumented libraries are loaded
import * as http from "http";

/*********************************************************************
 *  AZURE EVENTHUB SETUP
 **********************************************************************/
/** Connect to Azure Eventhub. */
const credential = new DefaultAzureCredential();
const eventHubHost = process.env["AZURE_EVENTHUB_HOST"] || "my-host-name";
const eventHubName = process.env["AZURE_EVENTHUB_NAME"] || "my-event-hub";
const client = new EventHubProducerClient(eventHubHost, eventHubName, credential);

async function handleEventHub(response: any) {
  const partitionIds = await client.getPartitionIds();
  response.end(JSON.stringify(partitionIds));
}

/*********************************************************************
 *  HTTP SERVER SETUP
 **********************************************************************/
/** Starts a HTTP server that receives requests on sample server port. */
let server: http.Server;
function startServer(port: number) {
  // Creates a server
  server = http.createServer(handleRequest);
  // Starts the server
  server.listen(port, () => {
    console.log(`Node HTTP listening on ${port}`);
  });
}

/** A function which handles requests and send response. */
function handleRequest(request: any, response: any) {
  const currentSpan = api.trace.getSpan(api.context.active());
  if (currentSpan) {
    // display traceid in the terminal
    console.log(`traceid: ${currentSpan.spanContext().traceId}`);
  }
  const span = tracer.startSpan("handleRequest", {
    kind: api.SpanKind.SERVER, // server
    attributes: { key: "value" }
  });
  // Annotate our span to capture metadata about the operation
  span.addEvent("invoking handleRequest");

  const body = [];
  request.on("error", (err: Error) => console.log(err));
  request.on("data", (chunk: string) => body.push(chunk));
  request.on("end", () => {

    if (request.url == '/') {
      response.end("Hello World!");
    }
    else if (request.url == '/eventhub') {
      handleEventHub(response);
    }
    span.end();
  });
}

startServer(8080);

