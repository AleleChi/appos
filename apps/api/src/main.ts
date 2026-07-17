import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  app.use(cookieParser());

  // Trust upstream reverse proxies (Render, Vercel, Nginx) safely (trusting 1 hop) for secure cookies and accurate IPs
  const expressInstance = app.getHttpAdapter().getInstance();
  if (expressInstance && typeof expressInstance.set === "function") {
    expressInstance.set("trust proxy", 1);
  }

  // Environment-aware port selection
  let port: number;

  if (process.env.NODE_ENV === "production") {
    const rawPort = process.env.PORT;
    if (!rawPort) {
      console.error("Production Startup Error: PORT environment variable is required in production mode.");
      process.exit(1);
    }
    port = parseInt(rawPort, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      console.error(`Production Startup Error: Invalid PORT environment variable configured: "${rawPort}"`);
      process.exit(1);
    }
  } else {
    // Local/internal API uses API_PORT, defaulting to 3001.
    // Prevent the API from inheriting the web preview’s PORT value (e.g. 3000) during local combined development.
    const rawApiPort = process.env.API_PORT || "3001";
    port = parseInt(rawApiPort, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
      console.error(`Local/internal Startup Error: Invalid API_PORT configured: "${rawApiPort}"`);
      process.exit(1);
    }
  }

  await app.listen(port, "0.0.0.0");
  console.log(`AppOS Standalone NestJS API running on http://0.0.0.0:${port}`);

  // In compliance with Milestone 1, background workers are started ONLY through an explicit bootstrap lifecycle
  const isTest = process.env.NODE_ENV === "test" || !!process.env.VITEST;
  const isBuild = process.env.NEXT_PHASE === "phase-production-build" || process.env.BUILD_TIME === "true";
  const isTypecheck = process.env.TYPECHECK === "true";
  const isLinting = process.env.LINTING === "true";

  if (!isTest && !isBuild && !isTypecheck && !isLinting) {
    const { queue } = await import("../../../src/lib/queue");
    queue.startWorker();
  }
}
bootstrap();
