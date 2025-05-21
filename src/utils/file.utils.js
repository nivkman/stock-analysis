// Utility functions for file operations
import { promises as fs } from 'fs';
import config from '../config/index.config.js';

/**
 * Ensures the data directory exists
 * @returns {Promise<void>}
 */
export const ensureDataDir = async () => {
  try {
    await fs.mkdir(config.paths.dataDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error('Error creating data directory:', error);
      process.exit(1);
    }
  }
};

/**
 * Loads watchlist from file
 * @returns {Promise<Array>} Array of stock symbols
 */
export const loadWatchlist = async () => {
  try {
    const data = await fs.readFile(config.paths.watchlistFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return empty array
      return [];
    }
    console.error('Error loading watchlist:', error);
    return [];
  }
};

/**
 * Saves watchlist to file
 * @param {Array} watchlist Array of stock symbols
 * @returns {Promise<void>}
 */
export const saveWatchlist = async (watchlist) => {
  try {
    await fs.writeFile(config.paths.watchlistFile, JSON.stringify(watchlist, null, 2));
  } catch (error) {
    console.error('Error saving watchlist:', error);
  }
};

/**
 * Loads signals from file
 * @returns {Promise<Object>} Object containing signals data
 */
export const loadSignals = async () => {
  try {
    const data = await fs.readFile(config.paths.signalsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return empty object
      return {};
    }
    console.error('Error loading signals:', error);
    return {};
  }
};

/**
 * Saves signals to file
 * @param {Object} signals Object containing signals data
 * @returns {Promise<void>}
 */
export const saveSignals = async (signals) => {
  try {
    await fs.writeFile(config.paths.signalsFile, JSON.stringify(signals, null, 2));
  } catch (error) {
    console.error('Error saving signals:', error);
  }
};
