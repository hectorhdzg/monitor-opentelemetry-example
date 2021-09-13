// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { NodeTracerProvider } from "@opentelemetry/node";
import { AzureMonitorTraceExporter } from "@azure/monitor-opentelemetry-exporter";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { MySQLInstrumentation } from "@opentelemetry/instrumentation-mysql";
import { SimpleSpanProcessor } from "@opentelemetry/tracing";

export function getOpenTelemetryTracer() {
    const provider = new NodeTracerProvider();
    const exporter = new AzureMonitorTraceExporter();
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter as any));
    // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
    provider.register();
    registerInstrumentations({
        instrumentations: [
            new HttpInstrumentation(),
            new MySQLInstrumentation()
        ]
    });
    return provider.getTracer("azure-example");
}