// Service for AI-enhanced signal generation
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import config from "../config/index.config.js";

const PROVIDERS = {
  OPENAI: "openai",
  CLAUDE: "claude",
  DEEPSEEK: "deepseek",
};

// --- Client Initialization ---
const openai = config.aiEnhancement.openai?.apiKey
  ? new OpenAI({ apiKey: config.aiEnhancement.openai.apiKey })
  : null;
const anthropic = config.aiEnhancement.claude?.apiKey
  ? new Anthropic({ apiKey: config.aiEnhancement.claude.apiKey })
  : null;
// DeepSeek does not require a client instance, but we check for the API key for symmetry and future extensibility
const deepseek = config.aiEnhancement.deepseek?.apiKey
  ? { apiKey: config.aiEnhancement.deepseek.apiKey, model: config.aiEnhancement.deepseek.model }
  : null;

if (!openai && config.aiEnhancement.enabled && config.aiEnhancement.defaultProvider === PROVIDERS.OPENAI) {
  console.warn("OpenAI API key is missing. AI enhancement for OpenAI will not work.");
}
if (!anthropic && config.aiEnhancement.enabled && config.aiEnhancement.defaultProvider === PROVIDERS.CLAUDE) {
  console.warn("Claude API key is missing. AI enhancement for Claude will not work.");
}
if (
  config.aiEnhancement.enabled &&
  config.aiEnhancement.defaultProvider === PROVIDERS.DEEPSEEK &&
  !(config.aiEnhancement.deepseek && config.aiEnhancement.deepseek.apiKey)
) {
  console.warn("DeepSeek API key is missing. AI enhancement for DeepSeek will not work.");
}

// --- Prompt Formatting Helper ---
function formatPrompt(symbol, currentPrice, technicalSignalResult, indicators, provider) {
  const providerConfig = config.aiEnhancement[provider];
  let prompt = providerConfig?.promptTemplate || config.aiEnhancement.openai?.promptTemplate || "";
  if (!prompt) {
    return `Symbol: ${symbol}, Price: ${currentPrice}, Signal: ${technicalSignalResult.signal}`;
  }
  const replacements = {
    "{symbol}": symbol,
    "{currentPrice}": currentPrice?.toFixed(2) || "N/A",
    "{technicalSignal}": technicalSignalResult.signal,
    "{technicalReasons}": technicalSignalResult.reasons.join(", "),
    "{rsi}": indicators.rsi?.toFixed(2) || "N/A",
    "{macdValue}": indicators.macd?.MACD?.toFixed(2) || "N/A",
    "{macdSignal}": indicators.macd?.signal?.toFixed(2) || "N/A",
    "{macdHistogram}": indicators.macd?.histogram?.toFixed(2) || "N/A",
    "{sma20}": indicators.sma?.sma20?.toFixed(2) || "N/A",
    "{sma50}": indicators.sma?.sma50?.toFixed(2) || "N/A",
    "{sma200}": indicators.sma?.sma200?.toFixed(2) || "N/A",
    "{bbLower}": indicators.bollingerBands?.lower?.toFixed(2) || "N/A",
    "{bbMiddle}": indicators.bollingerBands?.middle?.toFixed(2) || "N/A",
    "{bbUpper}": indicators.bollingerBands?.upper?.toFixed(2) || "N/A",
    "{support}": indicators.supportLevel?.toFixed(2) || "N/A",
    "{resistance}": indicators.resistanceLevel?.toFixed(2) || "N/A",
  };
  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replace(key, value);
  }
  return prompt;
}

// --- Provider Logic ---
async function callOpenAI(symbol, currentPrice, technicalSignalResult, indicators) {
  if (!openai) return { ...technicalSignalResult, source: "technical", error: "OpenAI client not initialized" };
  const prompt = formatPrompt(symbol, currentPrice, technicalSignalResult, indicators, PROVIDERS.OPENAI);
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: config.aiEnhancement.openai.model,
    response_format: { type: "json_object" },
  });
  const aiResponseContent = chatCompletion.choices[0]?.message?.content;
  if (!aiResponseContent) throw new Error("Empty response from OpenAI");
  return JSON.parse(aiResponseContent);
}

async function callClaude(symbol, currentPrice, technicalSignalResult, indicators) {
  if (!anthropic) return { ...technicalSignalResult, source: "technical", error: "Claude client not initialized" };
  const promptContent = formatPrompt(symbol, currentPrice, technicalSignalResult, indicators, PROVIDERS.CLAUDE);
  const claudeResponse = await anthropic.messages.create({
    model: config.aiEnhancement.claude.model,
    max_tokens: 1024,
    messages: [{ role: "user", content: promptContent }],
  });
  if (
    claudeResponse.content &&
    claudeResponse.content[0] &&
    claudeResponse.content[0].type === "text"
  ) {
    const responseText = claudeResponse.content[0].text;
    const jsonMatch = responseText.match(/\{.*\}/s);
    if (jsonMatch && jsonMatch[0]) {
      return JSON.parse(jsonMatch[0]);
    } else {
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Claude response is not valid JSON:", responseText);
        throw new Error("Claude response content is not valid JSON.");
      }
    }
  } else {
    console.error("Unexpected Claude response structure:", claudeResponse);
    throw new Error("Unexpected Claude response structure.");
  }
}

async function callDeepSeek(symbol, currentPrice, technicalSignalResult, indicators) {
  const dsConfig = config.aiEnhancement.deepseek;
  if (!dsConfig?.apiKey) return { ...technicalSignalResult, source: "technical", error: "DeepSeek API key missing" };
  const promptContent = formatPrompt(symbol, currentPrice, technicalSignalResult, indicators, PROVIDERS.DEEPSEEK);
  const deepseekApiResponse = await axios.post(
    "https://api.deepseek.com/chat/completions",
    {
      model: dsConfig.model,
      messages: [{ role: "user", content: promptContent }],
      response_format: { type: "json_object" },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${dsConfig.apiKey}`,
      },
    }
  );
  const content = deepseekApiResponse.data?.choices?.[0]?.message?.content;
  if (!content) {
    console.error("Unexpected DeepSeek API response structure:", deepseekApiResponse.data);
    throw new Error("Unexpected DeepSeek API response structure.");
  }
  return JSON.parse(content);
}

const PROVIDER_HANDLERS = {
  [PROVIDERS.OPENAI]: callOpenAI,
  [PROVIDERS.CLAUDE]: callClaude,
  [PROVIDERS.DEEPSEEK]: callDeepSeek,
};

// --- Main Exported Function ---
export const getEnhancedSignal = async (
  symbol,
  currentPrice,
  technicalSignalResult,
  indicators
) => {
  if (!config.aiEnhancement.enabled) {
    return { ...technicalSignalResult, source: "technical" };
  }
  const provider = config.aiEnhancement.defaultProvider;
  const handler = PROVIDER_HANDLERS[provider];
  if (!handler) {
    console.warn(`Unsupported AI provider: ${provider} or provider not configured.`);
    return { ...technicalSignalResult, source: "technical", error: "Unsupported/unconfigured AI provider" };
  }
  try {
    const aiResponseJson = await handler(symbol, currentPrice, technicalSignalResult, indicators);
    // Validate AI response structure
    if (
      aiResponseJson.signal &&
      typeof aiResponseJson.confidence === "number" &&
      Array.isArray(aiResponseJson.reasons)
    ) {
      return {
        signal: aiResponseJson.signal.toLowerCase(),
        confidence: aiResponseJson.confidence,
        reasons: aiResponseJson.reasons,
        source: provider,
      };
    } else {
      console.error("AI response has invalid structure:", aiResponseJson);
      throw new Error("AI response has invalid structure");
    }
  } catch (error) {
    console.error(`Error getting AI enhanced signal for ${symbol} using ${provider}:`, error.message);
    return { ...technicalSignalResult, source: "technical", error: error.message };
  }
};
