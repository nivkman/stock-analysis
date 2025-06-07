// Service for fetching and processing stock and crypto data
import { createRequire } from 'module';
import { createSpinner } from '../utils/cli.utils.js';

// Create require function for CommonJS modules
const require = createRequire(import.meta.url);

// Import Yahoo Finance (using CommonJS require)
const yahooFinance = require('yahoo-finance2');

// Helper to format crypto symbols for Yahoo Finance
const formatSymbol = (symbol) => {
  // Check if it's a cryptocurrency
  const cryptoSymbols = ['BTC', 'ETH', 'USDT', 'XRP', 'BNB', 'ADA', 'SOL', 'DOT', 'DOGE', 'SHIB'];
  const baseSymbol = symbol.replace(/-USD$|\.X$/, '');
  
  if (cryptoSymbols.includes(baseSymbol)) {
    // Yahoo Finance uses -USD suffix for cryptocurrencies
    return symbol.endsWith('-USD') ? symbol : `${baseSymbol}-USD`;
  }
  
  return symbol;
};

/**
 * Fetch stock data using Yahoo Finance API
 * @param {string} symbol Stock symbol
 * @param {string} interval Data interval ('daily', 'weekly', 'monthly')
 * @param {string} outputSize Amount of data to fetch ('compact' or 'full')
 * @returns {Promise<Array|null>} Formatted stock data or null if error
 */
export const fetchStockData = async (symbol, interval = 'daily', outputSize = 'compact') => {
  const formattedSymbol = formatSymbol(symbol);
  const spinner = createSpinner(`Fetching data for ${symbol}...`).start();
  
  try {
    // Set period based on outputSize parameter
    const period1 = outputSize === 'full' 
      ? '2010-01-01' 
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const period2 = new Date().toISOString().split('T')[0];
    
    // Map interval to Yahoo Finance interval
    const yahooInterval = interval === 'daily' ? '1d' : interval === 'weekly' ? '1wk' : '1mo';
    
    // Query Yahoo Finance
    const result = await yahooFinance.default.historical(formattedSymbol, {
      period1,
      period2,
      interval: yahooInterval,
    });
    
    if (!result || result.length === 0) {
      spinner.fail(`Invalid response for ${symbol}`);
      return null;
    }
    
    // Format data for analysis
    const formattedData = result.map(item => ({
      date: item.date.toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));
    
    spinner.succeed(`Successfully fetched data for ${symbol}`);
    return formattedData;
  } catch (error) {
    spinner.fail(`Error fetching data for ${symbol}: ${error.message}`);
    console.error(error);
    return null;
  }
};

/**
 * Fetch stock quote information
 * @param {string} symbol Stock symbol
 * @returns {Promise<Object|null>} Quote data or null if error
 */
export const fetchStockQuote = async (symbol) => {
  try {
    const formattedSymbol = formatSymbol(symbol);
    return await yahooFinance.default.quote(formattedSymbol);
  } catch (error) {
    console.log(`Could not get quote data for ${symbol}, but continuing with historical analysis.`);
    return null;
  }
};
