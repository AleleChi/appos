import { Controller, Get, Param, UseGuards, NotFoundException } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { queue } from "../../../src/lib/queue";

@Controller()
@UseGuards(AuthGuard)
export class JobsController {
  @Get(["api/jobs", "api/v1/jobs"])
  getJobs() {
    return { success: true, jobs: queue.getAllJobs() };
  }

  @Get(["api/jobs/:id", "api/v1/jobs/:id"])
  getJobById(@Param("id") id: string) {
    const job = queue.getJob(id);
    if (!job) {
      throw new NotFoundException("Job ID not found in background processor queue.");
    }
    return { success: true, job };
  }
}
