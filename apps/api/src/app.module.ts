import { Module } from "@nestjs/common";
import { DbService } from "./db.service";
import { AuthGuard } from "./auth.guard";
import { AuthController } from "./auth.controller";
import { WorkspacesController } from "./workspaces.controller";
import { ApplicationsController } from "./applications.controller";
import { AssetsController } from "./assets.controller";
import { JobsController } from "./jobs.controller";
import { SecurityController } from "./security.controller";
import { HealthController } from "./health.controller";

@Module({
  imports: [],
  controllers: [
    AuthController,
    WorkspacesController,
    ApplicationsController,
    AssetsController,
    JobsController,
    SecurityController,
    HealthController,
  ],
  providers: [
    DbService,
    AuthGuard,
  ],
  exports: [
    DbService,
    AuthGuard,
  ],
})
export class AppModule {}
