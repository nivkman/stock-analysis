// Service for technical analysis and indicators
import * as technicalIndicators from 'technicalindicators';
import config from '../config/index.config.js';

/**
 * Calculate technical indicators for a stock
 * @param {Array} data Historical price data
 * @returns {Object} Calculated indicators or error
 */
export const calculateIndicators = (data) => {
  if (!data || data.length < 50) {
    return { error: 'Insufficient data for analysis' };
  }

  const closes = data.map(item => item.close);
  const highs = data.map(item => item.high);
  const lows = data.map(item => item.low);
  const volumes = data.map(item => item.volume);
  
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
  
  // Calculate RSI
  const rsi = technicalIndicators.RSI.calculate({ 
    period: config.analysis.rsi.period, 
    values: closes 
  });
  
  // Calculate MACD
  const macd = technicalIndicators.MACD.calculate({
    fastPeriod: config.analysis.macd.fastPeriod,
    slowPeriod: config.analysis.macd.slowPeriod,
    signalPeriod: config.analysis.macd.signalPeriod,
    values: closes
  });
  
  // Calculate Bollinger Bands
  const bollingerBands = technicalIndicators.BollingerBands.calculate({
    period: config.analysis.bollingerBands.period,
    stdDev: config.analysis.bollingerBands.stdDev,
    values: closes
  });
  
  // Calculate Support and Resistance levels
  const lastPrice = closes[closes.length - 1];
  const recentPrices = closes.slice(-config.analysis.supportResistance.lookbackPeriod);
  const supportLevel = Math.min(...recentPrices);
  const resistanceLevel = Math.max(...recentPrices);
  
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
    resistanceLevel
  };
};

/**
 * Generate buy/sell signals based on technical indicators
 * @param {Object} indicators Calculated technical indicators
 * @returns {Object} Signal information with confidence and reasons
 */
export const generateSignal = (indicators) => {
  if (!indicators || indicators.error) {
    return { signal: 'hold', confidence: 0, reasons: ['Insufficient data'] };
  }
  
  const { lastPrice, sma, rsi, macd, bollingerBands, supportLevel, resistanceLevel } = indicators;
  const buySignals = [];
  const sellSignals = [];
  let buyConfidence = 0;
  let sellConfidence = 0;
  
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
  if (rsi < config.analysis.rsi.oversold) {
    buySignals.push('RSI indicates oversold condition');
    buyConfidence += 20;
  }
  
  // RSI overbought condition is bearish
  if (rsi > config.analysis.rsi.overbought) {
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
