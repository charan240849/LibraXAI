import { searchAgent } from './agents/search.agent';
import { recommendationAgent } from './agents/recommendation.agent';
import { inventoryAgent } from './agents/inventory.agent';
import { notificationAgent } from './agents/notification.agent';

/**
 * Orchestrator Service
 * Thin wrapper that coordinates agent calls
 * Can be used by routes or scheduler
 */
class OrchestratorService {
  /**
   * Search for books using the search agent
   */
  search(query: string, limit?: number) {
    return searchAgent.search(query, limit);
  }

  /**
   * Get book suggestions
   */
  suggest(prefix: string, limit?: number) {
    return searchAgent.suggest(prefix, limit);
  }

  /**
   * Get recommendations for a user
   */
  recommend(userId: number, limit?: number) {
    return recommendationAgent.recommendForUser(userId, limit);
  }

  /**
   * Get similar books
   */
  similar(bookId: number, limit?: number) {
    return recommendationAgent.findSimilar(bookId, limit);
  }

  /**
   * Scan inventory for low stock items
   */
  inventoryScan(threshold?: number) {
    return inventoryAgent.getLowStock(threshold);
  }

  /**
   * Get inventory summary
   */
  inventorySummary() {
    return inventoryAgent.getSummary();
  }

  /**
   * Run notifications job (due reminders + overdue notices)
   */
  async notificationsRun() {
    return notificationAgent.sendDueReminders();
  }
}

export const orchestrator = new OrchestratorService();
