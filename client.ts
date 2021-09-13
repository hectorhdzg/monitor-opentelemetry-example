// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import api from "@opentelemetry/api";

import { getOpenTelemetryTracer } from "./tracer";

// Load the .env file if it exists
import * as dotenv from "dotenv";
dotenv.config();

/*********************************************************************
 *  OPEN TELEMETRY SETUP
 **********************************************************************/
const tracer = getOpenTelemetryTracer();
// Open Telemetry setup need to happen before http library is loaded
import * as http from "http";

/*********************************************************************
 *  HTTP CLIENT SETUP
 **********************************************************************/
/** A function which makes requests and handles response. */
function makeRequest() {
  // span corresponds to outgoing requests. Here, we have manually created
  // the span, which is created to track work that happens outside of the
  // request lifecycle entirely.
  const span = tracer.startSpan("makeRequest");
  api.context.with(api.trace.setSpan(api.context.active(), span), () => {
    http.get(
      {
        host: "localhost",
        port: 8080
      },
      (response) => {
        const body: any = [];
        response.on("data", (chunk) => body.push(chunk));
        response.on("end", () => {
          console.log(body.toString());
          span.end();
        });
      }
    );
  });
}
makeRequest();
