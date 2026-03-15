import { env } from "@/src/config/env";
import { resumeWaitingExecutions } from "@/src/flows/engine";
import { logger } from "@/src/logger";

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;
  setInterval(async () => {
    try {
      await resumeWaitingExecutions();
    } catch (error) {
      logger.error("scheduler tick failed", error);
    }
  }, env.SCHEDULER_INTERVAL_MS);
  logger.info("scheduler started", { interval: env.SCHEDULER_INTERVAL_MS });
}
