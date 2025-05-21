// Service for handling CLI commands
import chalk from 'chalk';
import { createSpinner, promptUser } from '../utils/cli.utils.js';
import { loadWatchlist, saveWatchlist, loadSignals } from '../utils/file.utils.js';
import { analyzeStock, displayAnalysisResult, displayWatchlistTable, createAnalysisSummaryTable } from './analysis.service.js';

/**
 * Add a stock to the watchlist
 */
export const addStockToWatchlist = async () => {
  const { symbol } = await promptUser([
    {
      type: 'input',
      name: 'symbol',
      message: 'Enter stock symbol:',
      validate: input => input.trim() !== ''
    }
  ]);
  
  const formattedSymbol = symbol.trim().toUpperCase();
  
  // Check if symbol already exists in watchlist
  const watchlist = await loadWatchlist();
  if (watchlist.includes(formattedSymbol)) {
    console.log(chalk.yellow(`${formattedSymbol} is already in your watchlist.`));
    return;
  }
  
  // Analyze the stock first to make sure it exists
  const result = await analyzeStock(formattedSymbol);
  if (!result) {
    console.log(chalk.red(`Unable to analyze ${formattedSymbol}. Not adding to watchlist.`));
    return;
  }
  
  // Add to watchlist and save
  watchlist.push(formattedSymbol);
  await saveWatchlist(watchlist);
  
  console.log(chalk.green(`${formattedSymbol} added to watchlist.`));
  displayAnalysisResult(result);
};

/**
 * Remove a stock from the watchlist
 */
export const removeStockFromWatchlist = async () => {
  const watchlist = await loadWatchlist();
  
  if (watchlist.length === 0) {
    console.log(chalk.yellow('Your watchlist is empty.'));
    return;
  }
  
  const { symbol } = await promptUser([
    {
      type: 'list',
      name: 'symbol',
      message: 'Select stock to remove from watchlist:',
      choices: watchlist
    }
  ]);
  
  const newWatchlist = watchlist.filter(s => s !== symbol);
  await saveWatchlist(newWatchlist);
  
  console.log(chalk.green(`${symbol} removed from watchlist.`));
};

/**
 * Analyze a stock from user input
 */
export const analyzeStockFromInput = async () => {
  const { symbol } = await promptUser([
    {
      type: 'input',
      name: 'symbol',
      message: 'Enter stock symbol to analyze:',
      validate: input => input.trim() !== ''
    }
  ]);
  
  const formattedSymbol = symbol.trim().toUpperCase();
  const result = await analyzeStock(formattedSymbol);
  displayAnalysisResult(result);
  
  // Ask if they want to add to watchlist
  if (result) {
    const watchlist = await loadWatchlist();
    if (!watchlist.includes(formattedSymbol)) {
      const { addToWatchlist } = await promptUser([
        {
          type: 'confirm',
          name: 'addToWatchlist',
          message: 'Add this stock to your watchlist?',
          default: false
        }
      ]);
      
      if (addToWatchlist) {
        watchlist.push(formattedSymbol);
        await saveWatchlist(watchlist);
        console.log(chalk.green(`${formattedSymbol} added to watchlist.`));
      }
    }
  }
};

/**
 * Analyze all stocks in the watchlist
 */
export const analyzeAllWatchlist = async () => {
  const watchlist = await loadWatchlist();
  
  if (watchlist.length === 0) {
    console.log(chalk.yellow('Your watchlist is empty. Add stocks with the "add" command.'));
    return;
  }
  
  const spinner = createSpinner('Analyzing watchlist...').start();
  const results = [];
  
  for (const symbol of watchlist) {
    spinner.text = `Analyzing ${symbol}...`;
    const result = await analyzeStock(symbol);
    if (result) {
      results.push(result);
    }
  }
  
  spinner.succeed('Watchlist analysis complete');
  
  // Display summary table
  const table = createAnalysisSummaryTable(results);
  console.log(table.toString());
  
  // Ask if they want to see details for a specific stock
  const { viewDetails } = await promptUser([
    {
      type: 'confirm',
      name: 'viewDetails',
      message: 'View detailed analysis for a specific stock?',
      default: false
    }
  ]);
  
  if (viewDetails) {
    const { symbol } = await promptUser([
      {
        type: 'list',
        name: 'symbol',
        message: 'Select stock to view detailed analysis:',
        choices: results.map(r => r.symbol)
      }
    ]);
    
    const selectedResult = results.find(r => r.symbol === symbol);
    displayAnalysisResult(selectedResult);
  }
};

/**
 * Display the watchlist
 */
export const displayWatchlist = async () => {
  const watchlist = await loadWatchlist();
  const signals = await loadSignals();
  displayWatchlistTable(watchlist, signals);
};
