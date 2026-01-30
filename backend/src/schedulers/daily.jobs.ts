import cron from 'node-cron';
import { config } from '../config';
import { orchestrator } from '../services/orchestrator.service';

/**
 * Initialize daily scheduled jobs
 */
export function initializeScheduler(): void {
  // Daily notification job at 08:00 (or configured time)
  cron.schedule(config.cronDailyTime, async () => {
    console.log(`[${new Date().toISOString()}] Running daily notification job...`);
    
    try {
      const result = await orchestrator.notificationsRun();
      console.log(`[${new Date().toISOString()}] Notification job completed:`, result);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Notification job failed:`, error);
    }
  });

  console.log(`Scheduler initialized. Daily job scheduled at: ${config.cronDailyTime}`);
}
