// Configuration for the Stock & Crypto Projector CLI application
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
  // Asset types
  assetTypes: {
    stock: 'stock',
    crypto: 'crypto'
  },
  
  // Cryptocurrency settings
  crypto: {
    supportedSymbols: [
      'BTC-USD', // Bitcoin
      'ETH-USD', // Ethereum
      'USDT-USD', // Tether
      'XRP-USD', // Ripple
      'BNB-USD', // Binance Coin
      'ADA-USD', // Cardano
      'SOL-USD', // Solana
      'DOT-USD', // Polkadot
      'DOGE-USD', // Dogecoin
      'SHIB-USD'  // Shiba Inu
    ],
    // Crypto-specific analysis adjustments
    analysis: {
      // Crypto markets are more volatile, so adjust RSI thresholds
      rsi: {
        period: 14,
        oversold: 25,  // More extreme than stocks
        overbought: 75 // More extreme than stocks
      },
      // Higher volatility means wider Bollinger Bands
      bollingerBands: {
        period: 20,
        stdDev: 2.5    // Wider than stocks
      }
    }
  },
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
  },

  // AI Enhancement settings
  aiEnhancement: {
    enabled: process.env.AI_ENHANCEMENT_ENABLED === 'true' || false, // Set to true in .env to enable
    defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'openai', // 'openai', 'claude', 'deepseek'
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      promptTemplate: `
Analyze the following stock data and technical signals to provide an enhanced trading signal (buy, sell, or hold), 
a confidence score (0-100), and a brief reasoning (max 3 bullet points).
Symbol: {symbol}
Current Price: {currentPrice}
Technical Signal: {technicalSignal}
Technical Reasons: {technicalReasons}
Indicators:
  RSI: {rsi}
  MACD: {macdValue} (Signal: {macdSignal}, Histogram: {macdHistogram})
  SMA20: {sma20}
  SMA50: {sma50}
  SMA200: {sma200}
  Bollinger Bands: Lower: {bbLower}, Middle: {bbMiddle}, Upper: {bbUpper}
  Support: {support}
  Resistance: {resistance}

Respond in JSON format: {"signal": "buy/sell/hold", "confidence": <number>, "reasons": ["reason1", "reason2"]}
`
    },
    claude: { // Placeholder for Claude
      apiKey: process.env.CLAUDE_API_KEY,
      model: process.env.CLAUDE_MODEL || 'claude-3-opus-20240229', // Prioritize .env
      promptTemplate: process.env.CLAUDE_PROMPT_TEMPLATE || `
Analyze the following stock data and technical signals to provide an enhanced trading signal (buy, sell, or hold), 
a confidence score (0-100), and a brief reasoning (max 3 bullet points).
Symbol: {symbol}
Current Price: {currentPrice}
Technical Signal: {technicalSignal}
Technical Reasons: {technicalReasons}
Indicators:
  RSI: {rsi}
  MACD: {macdValue} (Signal: {macdSignal}, Histogram: {macdHistogram})
  SMA20: {sma20}
  SMA50: {sma50}
  SMA200: {sma200}
  Bollinger Bands: Lower: {bbLower}, Middle: {bbMiddle}, Upper: {bbUpper}
  Support: {support}
  Resistance: {resistance}

Respond in JSON format: {"signal": "buy/sell/hold", "confidence": <number>, "reasons": ["reason1", "reason2"]}
`
    },
    deepseek: { // Placeholder for DeepSeek
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-coder', // Prioritize .env
      promptTemplate: process.env.DEEPSEEK_PROMPT_TEMPLATE || `
Analyze the following stock data and technical signals to provide an enhanced trading signal (buy, sell, or hold), 
a confidence score (0-100), and a brief reasoning (max 3 bullet points).
Symbol: {symbol}
Current Price: {currentPrice}
Technical Signal: {technicalSignal}
Technical Reasons: {technicalReasons}
Indicators:
  RSI: {rsi}
  MACD: {macdValue} (Signal: {macdSignal}, Histogram: {macdHistogram})
  SMA20: {sma20}
  SMA50: {sma50}
  SMA200: {sma200}
  Bollinger Bands: Lower: {bbLower}, Middle: {bbMiddle}, Upper: {bbUpper}
  Support: {support}
  Resistance: {resistance}

Respond in JSON format: {"signal": "buy/sell/hold", "confidence": <number>, "reasons": ["reason1", "reason2"]}
`
    }
  }
};

export default config;
