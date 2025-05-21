// Service for scheduling automated analysis
import cron from 'node-cron';
import chalk from 'chalk';
import { loadWatchlist } from '../utils/file.utils.js';
import { analyzeStock } from './analysis.service.js';
import { setupNotifications } from './notification.service.js';
import config from '../config/index.config.js';

/**
 * Schedule daily analysis for all watchlist stocks
 */
export const setupScheduledAnalysis = () => {
  // Run at the time specified in config (default: 5:00 PM Monday through Friday)
  cron.schedule(config.schedule.cronExpression, async () => {
    console.log(chalk.blue('Running scheduled analysis for watchlist...'));
    
    const watchlist = await loadWatchlist();
    const notifier = setupNotifications();
    
    for (const symbol of watchlist) {
      const result = await analyzeStock(symbol);
      
      if (result && (result.signalResult.signal === 'buy' || result.signalResult.signal === 'sell')) {
        if (notifier) {
          notifier.sendNotification(
            symbol, 
            result.signalResult.signal, 
            result.currentPrice, 
            result.signalResult.reasons
          );
        }
        
        console.log(chalk.bold(`${symbol}: ${result.signalResult.signal.toUpperCase()} signal generated`));
      }
    }
    
    console.log(chalk.green('Scheduled analysis complete'));
  });
  
  console.log(chalk.green(`Scheduled analysis set up to run at ${config.schedule.cronExpression}`));
};
