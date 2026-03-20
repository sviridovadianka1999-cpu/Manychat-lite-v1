import { env } from "@/src/config/env";
import { resumeWaitingExecutions } from "@/src/flows/engine";
import { logger } from "@/src/logger";

declare global {
  // eslint-disable-next-line no-var
  var __manychatSchedulerStarted__: boolean | undefined;
}

export function startScheduler() {
  if (globalThis.__manychatSchedulerStarted__) return;
  globalThis.__manychatSchedulerStarted__ = true;

  setInterval(async () => {
    try {
      await resumeWaitingExecutions();
    } catch (error) {
      logger.error("scheduler tick failed", error);
    }
  }, env.SCHEDULER_INTERVAL_MS);

  logger.info("scheduler started", { interval: env.SCHEDULER_INTERVAL_MS });
}
