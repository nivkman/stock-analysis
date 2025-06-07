// Service for technical analysis and indicators for stocks and cryptocurrencies
import * as technicalIndicators from 'technicalindicators';
import config from '../config/index.config.js';

/**
 * Determine if a symbol is a cryptocurrency
 * @param {string} symbol Symbol to check
 * @returns {boolean} True if cryptocurrency, false otherwise
 */
const isCryptocurrency = (symbol) => {
  // Check if symbol is in the supported crypto list or has -USD suffix
  return config.crypto.supportedSymbols.includes(symbol) || 
         symbol.endsWith('-USD') || 
         symbol.endsWith('.X');
};

/**
 * Get appropriate analysis parameters based on asset type
 * @param {string} symbol Symbol to analyze
 * @param {string} indicatorType Type of indicator (e.g., 'rsi', 'bollingerBands')
 * @returns {Object} Analysis parameters
 */
const getAnalysisParams = (symbol, indicatorType) => {
  const isCrypto = isCryptocurrency(symbol);
  
  // For indicators that have crypto-specific settings
  if (isCrypto && config.crypto.analysis[indicatorType]) {
    return config.crypto.analysis[indicatorType];
  }
  
  // Default to standard stock parameters
  return config.analysis[indicatorType];
};

/**
 * Calculate technical indicators for a stock
 * @param {Array} data Historical price data
 * @returns {Object} Calculated indicators or error
 */
export const calculateIndicators = (data, symbol = '') => {
  if (!data || data.length < 50) {
    return { error: 'Insufficient data for analysis' };
  }

  const closes = data.map(item => item.close);
  const highs = data.map(item => item.high);
  const lows = data.map(item => item.low);
  const volumes = data.map(item => item.volume);
  
  // Determine if this is a cryptocurrency
  const isCrypto = isCryptocurrency(symbol);
  
  // Calculate Moving Averages
  const sma20 = technicalIndicators.SMA.calculate({ 
    period: config.analysis.sma.shortPeriod, 
    values: closes 
  });
  
  const sma50 = technicalIndicators.SMA.calculate({ 
    period: config.analysis.sma.mediumPeriod, 
    values: closes 
  });
  
  const sma200 = technicalIndicators.SMA.calculate({ 
    period: config.analysis.sma.longPeriod, 
    values: closes 
  });
  
  // Calculate RSI with appropriate parameters
  const rsiParams = getAnalysisParams(symbol, 'rsi');
  const rsi = technicalIndicators.RSI.calculate({ 
    period: rsiParams.period, 
    values: closes 
  });
  
  // Calculate MACD
  const macd = technicalIndicators.MACD.calculate({
    fastPeriod: config.analysis.macd.fastPeriod,
    slowPeriod: config.analysis.macd.slowPeriod,
    signalPeriod: config.analysis.macd.signalPeriod,
    values: closes
  });
  
  // Calculate Bollinger Bands with appropriate parameters
  const bbParams = getAnalysisParams(symbol, 'bollingerBands');
  const bollingerBands = technicalIndicators.BollingerBands.calculate({
    period: bbParams.period,
    stdDev: bbParams.stdDev,
    values: closes
  });
  
  // Calculate Support and Resistance levels
  const lastPrice = closes[closes.length - 1];
  const recentPrices = closes.slice(-config.analysis.supportResistance.lookbackPeriod);
  const supportLevel = Math.min(...recentPrices);
  const resistanceLevel = Math.max(...recentPrices);
  
  // Calculate volume statistics
  const avgVolume20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.max(volumes.slice(-20).length, 1);
  const currentVolume = volumes[volumes.length - 1];

  return {
    lastPrice,
    sma: {
      sma20: sma20[sma20.length - 1],
      sma50: sma50[sma50.length - 1],
      sma200: sma200[sma200.length - 1]
    },
    rsi: rsi[rsi.length - 1],
    macd: macd[macd.length - 1],
    bollingerBands: bollingerBands[bollingerBands.length - 1],
    supportLevel,
    resistanceLevel,
    avgVolume20,
    currentVolume
  };
};

/**
 * Generate buy/sell signals based on technical indicators
 * @param {Object} indicators Calculated technical indicators
 * @returns {Object} Signal information with confidence and reasons
 */
export const generateSignal = (indicators, symbol = '') => {
  if (!indicators || indicators.error) {
    return { signal: 'hold', confidence: 0, reasons: ['Insufficient data'] };
  }
  
  const { lastPrice, sma, rsi, macd, bollingerBands, supportLevel, resistanceLevel, avgVolume20, currentVolume } = indicators;
  const buySignals = [];
  const sellSignals = [];
  let buyConfidence = 0;
  let sellConfidence = 0;
  
  // Get appropriate RSI thresholds based on asset type
  const isCrypto = isCryptocurrency(symbol);
  const rsiParams = getAnalysisParams(symbol, 'rsi');
  
  // Price crossing above SMA 50 is bullish
  if (lastPrice > sma.sma50 && lastPrice < sma.sma50 * 1.02) {
    buySignals.push('Price crossed above 50-day SMA');
    buyConfidence += 15;
  }
  
  // Price crossing below SMA 50 is bearish
  if (lastPrice < sma.sma50 && lastPrice > sma.sma50 * 0.98) {
    sellSignals.push('Price crossed below 50-day SMA');
    sellConfidence += 15;
  }
  
  // RSI oversold condition is bullish
  if (rsi < rsiParams.oversold) {
    buySignals.push('RSI indicates oversold condition');
    buyConfidence += 20;
  }
  
  // RSI overbought condition is bearish
  if (rsi > rsiParams.overbought) {
    sellSignals.push('RSI indicates overbought condition');
    sellConfidence += 20;
  }
  
  // MACD line crossing above signal line is bullish
  if (macd.MACD > macd.signal && macd.histogram > 0) {
    buySignals.push('MACD crossed above signal line');
    buyConfidence += 20;
  }
  
  // MACD line crossing below signal line is bearish
  if (macd.MACD < macd.signal && macd.histogram < 0) {
    sellSignals.push('MACD crossed below signal line');
    sellConfidence += 20;
  }
  
  // Price near support level is bullish
  if (lastPrice < supportLevel * 1.05) {
    buySignals.push('Price near support level');
    buyConfidence += 15;
  }
  
  // Price near resistance level is bearish
  if (lastPrice > resistanceLevel * 0.95) {
    sellSignals.push('Price near resistance level');
    sellConfidence += 15;
  }
  
  // --- Volume-based confidence adjustment ---
  if (typeof currentVolume === 'number' && typeof avgVolume20 === 'number' && avgVolume20 > 0) {
    if (currentVolume > avgVolume20 * 1.5) {
      // High volume: boost confidence
      if (buyConfidence > sellConfidence) {
        buyConfidence += 10;
        buySignals.push('High volume supports bullish signal');
      } else if (sellConfidence > buyConfidence) {
        sellConfidence += 10;
        sellSignals.push('High volume supports bearish signal');
      } else if (buyConfidence === sellConfidence && buyConfidence > 0) {
        buyConfidence += 5;
        sellConfidence += 5;
        buySignals.push('High volume present, but signals are mixed');
        sellSignals.push('High volume present, but signals are mixed');
      }
    } else if (currentVolume < avgVolume20 * 0.7) {
      // Low volume: reduce confidence
      if (buyConfidence > sellConfidence) {
        buyConfidence = Math.max(0, buyConfidence - 5);
        buySignals.push('Low volume reduces bullish confidence');
      } else if (sellConfidence > buyConfidence) {
        sellConfidence = Math.max(0, sellConfidence - 5);
        sellSignals.push('Low volume reduces bearish confidence');
      } else if (buyConfidence === sellConfidence && buyConfidence > 0) {
        buyConfidence = Math.max(0, buyConfidence - 2);
        sellConfidence = Math.max(0, sellConfidence - 2);
        buySignals.push('Low volume present, confidence reduced');
        sellSignals.push('Low volume present, confidence reduced');
      }
    }
  }

  // Bollinger Band analysis
  if (lastPrice < bollingerBands.lower) {
    buySignals.push('Price below lower Bollinger Band');
    buyConfidence += 15;
  }
  
  if (lastPrice > bollingerBands.upper) {
    sellSignals.push('Price above upper Bollinger Band');
    sellConfidence += 15;
  }
  
  // Golden Cross (SMA 50 crossing above SMA 200) is a strong bullish signal
  if (sma.sma50 > sma.sma200 && sma.sma50 < sma.sma200 * 1.02) {
    buySignals.push('Golden Cross detected');
    buyConfidence += 25;
  }
  
  // Death Cross (SMA 50 crossing below SMA 200) is a strong bearish signal
  if (sma.sma50 < sma.sma200 && sma.sma50 > sma.sma200 * 0.98) {
    sellSignals.push('Death Cross detected');
    sellConfidence += 25;
  }
  
  // Determine final signal based on confidence scores
  let finalSignal = 'hold';
  let confidence = 0;
  let reasons = [];
  
  if (buyConfidence > sellConfidence && buyConfidence >= config.analysis.signalThreshold) {
    finalSignal = 'buy';
    confidence = buyConfidence;
    reasons = buySignals;
  } else if (sellConfidence > buyConfidence && sellConfidence >= config.analysis.signalThreshold) {
    finalSignal = 'sell';
    confidence = sellConfidence;
    reasons = sellSignals;
  } else {
    finalSignal = 'hold';
    confidence = 100 - Math.max(buyConfidence, sellConfidence);
    reasons = ['No strong buy or sell signals detected'];
  }
  
  return {
    signal: finalSignal,
    confidence,
    reasons
  };
};
