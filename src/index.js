// Main entry point for the Stock Projector CLI application

import { ensureDataDir } from './utils/file.utils.js';
import { initInquirer, promptUser, displayHeader } from './utils/cli.utils.js';
import { setupScheduledAnalysis } from './services/scheduling.service.js';
import {
  addStockToWatchlist,
  removeStockFromWatchlist,
  analyzeStockFromInput,
  analyzeAllWatchlist,
  displayWatchlist
} from './services/command.service.js';

/**
 * Show the main menu and handle user selections
 */
async function showMainMenu() {
  displayHeader();
  
  while (true) {
    const { action } = await promptUser([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'View Watchlist', value: 'watchlist' },
          { name: 'Analyze a Stock', value: 'analyze' },
          { name: 'Analyze All Watchlist Stocks', value: 'analyze_all' },
          { name: 'Add Stock to Watchlist', value: 'add' },
          { name: 'Remove Stock from Watchlist', value: 'remove' },
          { name: 'Set Up Scheduled Alerts', value: 'schedule' },
          { name: 'Exit', value: 'exit' }
        ]
      }
    ]);
    
    switch (action) {
      case 'watchlist':
        await displayWatchlist();
        break;
      case 'analyze':
        await analyzeStockFromInput();
        break;
      case 'analyze_all':
        await analyzeAllWatchlist();
        break;
      case 'add':
        await addStockToWatchlist();
        break;
      case 'remove':
        await removeStockFromWatchlist();
        break;
      case 'schedule':
        setupScheduledAnalysis();
        break;
      case 'exit':
        console.log('Thank you for using Stock Projector CLI!');
        process.exit(0);
    }
  }
}

/**
 * Application entry point
 */
async function main() {
  try {
    // Initialize inquirer with fallback support
    // await initInquirer();
    
    // Ensure data directory exists
    await ensureDataDir();
    
    // Show main menu
    await showMainMenu();
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

// Start the application
main();
