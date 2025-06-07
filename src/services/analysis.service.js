// Service for stock analysis coordination
import chalk from 'chalk';
import { fetchStockData, fetchStockQuote } from './stockData.service.js';
import { calculateIndicators, generateSignal } from './technicalAnalysis.service.js';
import { getEnhancedSignal } from './aiEnhancement.service.js';
import { loadSignals, saveSignals } from '../utils/file.utils.js';
import { createTable, formatSignal } from '../utils/cli.utils.js';

/**
 * Analyze a stock symbol
 * @param {string} symbol Stock symbol to analyze
 * @returns {Promise<Object|null>} Analysis result or null if error
 */
export const analyzeStock = async (symbol) => {
  try {
    // Get quote information for the stock
    const quote = await fetchStockQuote(symbol);
    
    // Get historical price data
    const stockData = await fetchStockData(symbol, 'daily', 'full');
    if (!stockData) {
      return null;
    }
    
    // Calculate technical indicators
    const indicators = calculateIndicators(stockData, symbol);
    let technicalSignal = generateSignal(indicators, symbol);
    const currentPrice = quote ? quote.regularMarketPrice : stockData[stockData.length - 1].close;

    // Get AI enhanced signal if enabled
    const aiSignal = await getEnhancedSignal(symbol, currentPrice, technicalSignal, indicators);

    // --- Merge logic: combine technical and AI signals ---
    let mergedSignal, mergedConfidence, mergedReasons = [], mergedSource = '';
    if (aiSignal.signal === technicalSignal.signal) {
      mergedSignal = aiSignal.signal;
      mergedConfidence = Math.round((aiSignal.confidence + technicalSignal.confidence) / 2);
      mergedReasons = [
        `Both AI and Technical agree: ${aiSignal.signal}.`,
        ...new Set([...(aiSignal.reasons || []), ...(technicalSignal.reasons || [])])
      ];
      mergedSource = 'ai+technical';
    } else {
      // If disagree, pick the one with higher confidence, or hold if both are low/conflicting
      if (aiSignal.confidence > technicalSignal.confidence) {
        mergedSignal = aiSignal.signal;
        mergedConfidence = aiSignal.confidence;
        mergedReasons = [
          `AI (${aiSignal.signal}, confidence ${aiSignal.confidence}) overrides Technical (${technicalSignal.signal}, confidence ${technicalSignal.confidence})`,
          ...(aiSignal.reasons || [])
        ];
        mergedSource = 'ai';
      } else if (technicalSignal.confidence > aiSignal.confidence) {
        mergedSignal = technicalSignal.signal;
        mergedConfidence = technicalSignal.confidence;
        mergedReasons = [
          `Technical (${technicalSignal.signal}, confidence ${technicalSignal.confidence}) overrides AI (${aiSignal.signal}, confidence ${aiSignal.confidence})`,
          ...(technicalSignal.reasons || [])
        ];
        mergedSource = 'technical';
      } else {
        mergedSignal = 'hold';
        mergedConfidence = Math.max(aiSignal.confidence, technicalSignal.confidence);
        mergedReasons = ['AI and Technical disagree with similar confidence; defaulting to hold.'];
        mergedSource = 'conflict';
      }
    }

    // Save to signals file
    const allSignals = await loadSignals();
    allSignals[symbol] = {
      lastSignal: mergedSignal,
      lastSignalSource: mergedSource,
      lastSignalDate: new Date().toISOString(),
      currentPrice,
      indicators: {
        ...indicators,
        ai: aiSignal,
        technical: technicalSignal,
        confidence: mergedConfidence,
        reasons: mergedReasons
      },
      historicalSignals: [
        ...(allSignals[symbol]?.historicalSignals || []),
        {
          signal: mergedSignal,
          price: currentPrice,
          date: new Date().toISOString(),
          ai: aiSignal,
          technical: technicalSignal
        }
      ].slice(-10)
    };

    await saveSignals(allSignals);

    return {
      symbol,
      signalResult: {
        signal: mergedSignal,
        confidence: mergedConfidence,
        reasons: mergedReasons,
        source: mergedSource,
        ai: aiSignal,
        technical: technicalSignal
      },
      currentPrice,
      indicators,
      companyName: quote?.shortName || quote?.longName || symbol
    };
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error);
    return null;
  }
};

/**
 * Display the analysis result in the terminal
 * @param {Object} result Analysis result
 */
export const displayAnalysisResult = (result) => {
  if (!result) {
    console.log(chalk.red('Analysis failed. Please try again.'));
    return;
  }
  
  const { symbol, signalResult, currentPrice, indicators, companyName } = result;
  
  console.log('\n' + chalk.bold(`Analysis for ${symbol} ${companyName ? `(${companyName})` : ''} - $${currentPrice.toFixed(2)}`));
  
  // Display signal with color
  let signalColor;
  if (signalResult.signal === 'buy') signalColor = chalk.green;
  else if (signalResult.signal === 'sell') signalColor = chalk.red;
  else signalColor = chalk.yellow;
  
  const signalSourceText = signalResult.source && signalResult.source !== 'technical' 
    ? ` (${signalResult.source.charAt(0).toUpperCase() + signalResult.source.slice(1)} Enhanced)` 
    : '';
  console.log(`
Signal${signalSourceText}: ${signalColor.bold(signalResult.signal.toUpperCase())}`);
  console.log(`Confidence: ${signalColor.bold(signalResult.confidence + '%')}`);
  
  // Display reasons
  console.log('\nReasons:');
  signalResult.reasons.forEach(reason => {
    console.log(chalk.cyan(`- ${reason}`));
  });
  
  // Display key indicators
  console.log('\nKey Indicators:');
  console.log(`- RSI: ${indicators.rsi.toFixed(2)}`);
  console.log(`- Support Level: $${indicators.supportLevel.toFixed(2)}`);
  console.log(`- Resistance Level: $${indicators.resistanceLevel.toFixed(2)}`);
  console.log(`- SMA 20: $${indicators.sma.sma20.toFixed(2)}`);
  console.log(`- SMA 50: $${indicators.sma.sma50.toFixed(2)}`);
  console.log(`- SMA 200: $${indicators.sma.sma200.toFixed(2)}`);
  
  if (indicators.macd) {
    console.log(`- MACD: ${indicators.macd.MACD.toFixed(2)}`);
    console.log(`- MACD Signal: ${indicators.macd.signal.toFixed(2)}`);
    console.log(`- MACD Histogram: ${indicators.macd.histogram.toFixed(2)}`);
  }
  
  if (indicators.bollingerBands) {
    console.log(`- Bollinger Upper: $${indicators.bollingerBands.upper.toFixed(2)}`);
    console.log(`- Bollinger Middle: $${indicators.bollingerBands.middle.toFixed(2)}`);
    console.log(`- Bollinger Lower: $${indicators.bollingerBands.lower.toFixed(2)}`);
  }
};

/**
 * Display watchlist in a table
 * @param {Array} watchlist Array of stock symbols
 * @param {Object} signals Signals data
 */
export const displayWatchlistTable = (watchlist, signals) => {
  if (watchlist.length === 0) {
    console.log(chalk.yellow('Your watchlist is empty. Add stocks with the "add" command.'));
    return;
  }
  
  const table = createTable(
    ['Symbol', 'Last Price', 'Signal', 'Confidence', 'Date'],
    [10, 12, 10, 12, 24]
  );
  
  for (const symbol of watchlist) {
    const stockData = signals[symbol];
    if (!stockData) {
      table.push([symbol, 'N/A', 'N/A', 'N/A', 'N/A']);
      continue;
    }
    const signalText = stockData.lastSignalSource && stockData.lastSignalSource !== 'technical' 
      ? `${formatSignal(stockData.lastSignal)} (${stockData.lastSignalSource.charAt(0).toUpperCase()})` 
      : formatSignal(stockData.lastSignal);
    
    table.push([
      symbol,
      `$${stockData.currentPrice?.toFixed(2) || 'N/A'}`,
      signalText,
      `${stockData.indicators?.confidence || 'N/A'}%`,
      new Date(stockData.lastSignalDate).toLocaleString()
    ]);
  }
  
  console.log(table.toString());
};

/**
 * Display summary table for multiple analysis results
 * @param {Array} results Array of analysis results
 * @returns {Object} Table object
 */
export const createAnalysisSummaryTable = (results) => {
  const table = createTable(
    ['Symbol', 'Price', 'Signal', 'Confidence'],
    [10, 12, 10, 12]
  );
  
  results.forEach(result => {
    table.push([
      result.symbol,
      `$${result.currentPrice.toFixed(2)}`,
      `${formatSignal(result.signalResult.signal)}${result.signalResult.source && result.signalResult.source !== 'technical' ? ` (${result.signalResult.source.charAt(0).toUpperCase()})` : ''}`,
      `${result.signalResult.confidence}%`
    ]);
  });
  
  return table;
};
