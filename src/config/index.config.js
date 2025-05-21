// Configuration for the Stock Projector CLI application
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current file directory (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directory is two levels up from config directory
const BASE_DIR = path.join(__dirname, '../..');

// Configuration object
const config = {
  // Data storage paths
  paths: {
    dataDir: path.join(BASE_DIR, 'data'),
    watchlistFile: path.join(BASE_DIR, 'data', 'watchlist.json'),
    signalsFile: path.join(BASE_DIR, 'data', 'signals.json')
  },
  
  // Email notification settings
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    notificationEmail: process.env.NOTIFICATION_EMAIL,
    service: 'gmail'
  },
  
  // Schedule settings
  schedule: {
    // Run at 5:00 PM (17:00) Monday through Friday
    cronExpression: '0 17 * * 1-5'
  },
  
  // Technical analysis settings
  analysis: {
    // Moving averages
    sma: {
      shortPeriod: 20,
      mediumPeriod: 50,
      longPeriod: 200
    },
    // RSI settings
    rsi: {
      period: 14,
      oversold: 30,
      overbought: 70
    },
    // MACD settings
    macd: {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9
    },
    // Bollinger Bands settings
    bollingerBands: {
      period: 20,
      stdDev: 2
    },
    // Signal confidence thresholds
    signalThreshold: 30,
    // Support/Resistance calculation
    supportResistance: {
      lookbackPeriod: 30
    }
  }
};

export default config;
