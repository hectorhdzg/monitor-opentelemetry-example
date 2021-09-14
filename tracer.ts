// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { NodeTracerProvider, NodeTracerConfig } from "@opentelemetry/node";
import { AzureMonitorTraceExporter } from "@azure/monitor-opentelemetry-exporter";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { MySQLInstrumentation } from "@opentelemetry/instrumentation-mysql";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/tracing";
import { Resource } from "@opentelemetry/resources";


export function getOpenTelemetryTracer() {
    const config: NodeTracerConfig = {
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: 'TestServiceName',
            [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'TestNamespace',
            [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: '123456789',
        }),
    };
    const provider = new NodeTracerProvider(config);
    const azureExporter = new AzureMonitorTraceExporter();
    // Configure span processor to send spans to the exporter
    const jaegerExporter = new JaegerExporter({
        endpoint: 'http://localhost:14268/api/traces',
    });

    provider.addSpanProcessor(new SimpleSpanProcessor(azureExporter));
    provider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter));
    provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

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