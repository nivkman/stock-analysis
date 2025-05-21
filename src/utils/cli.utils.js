// Utility functions for CLI interface
import chalk from 'chalk';
import Table from 'cli-table';
import figlet from 'figlet';
import inquirer from 'inquirer';
import ora from 'ora';
import { createRequire } from 'module';

// Create require function for CommonJS modules
const require = createRequire(import.meta.url);

// Handle inquirer compatibility issues
let inquirerFallback;

/**
 * Initialize the inquirer module with fallback support
 * @returns {Promise<void>}
 */
export const initInquirer = async () => {
  try {
    // Try to use the ES module version first
    await inquirer.prompt([{ type: 'input', name: 'test', message: 'test', default: '' }]);
  } catch (error) {
    // If it fails, fall back to CommonJS version
    console.log(chalk.yellow('Using fallback for inquirer...'));
    inquirerFallback = require('inquirer');
  }
};

/**
 * Prompt user with questions using the appropriate inquirer version
 * @param {Array} questions Array of inquirer question objects
 * @returns {Promise<Object>} User responses
 */
export const promptUser = async (questions) => {
  if (inquirerFallback) {
    return inquirerFallback.prompt(questions);
  }
  return inquirer.prompt(questions);
};

/**
 * Create a spinner with the given text
 * @param {string} text Text to display with the spinner
 * @returns {Object} Ora spinner instance
 */
export const createSpinner = (text) => ora(text);

/**
 * Display application header
 */
export const displayHeader = () => {
  console.log('\n');
  console.log(chalk.blue(figlet.textSync('Stock Projector', { horizontalLayout: 'full' })));
  console.log(chalk.blue('CLI Stock Analysis Tool\n'));
};

/**
 * Create a table for displaying data
 * @param {Array} headers Array of header strings
 * @param {Array} colWidths Array of column widths
 * @returns {Object} CLI-table instance
 */
export const createTable = (headers, colWidths) => {
  return new Table({
    head: headers.map(header => chalk.white.bold(header)),
    colWidths
  });
};

/**
 * Format a signal with appropriate color
 * @param {string} signal Signal string ('buy', 'sell', or 'hold')
 * @returns {string} Colored signal text
 */
export const formatSignal = (signal) => {
  if (signal === 'buy') return chalk.green('BUY');
  if (signal === 'sell') return chalk.red('SELL');
  return chalk.yellow('HOLD');
};
