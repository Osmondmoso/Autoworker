/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

// Default NVIDIA API Key provided by user
let nvidiaApiKey = process.env.NVIDIA_API_KEY || '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';

let nvidiaClient = new OpenAI({
  apiKey: nvidiaApiKey,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const geminiClient = new GoogleGenAI();

export function setNvidiaApiKey(key: string) {
  nvidiaApiKey = key.trim();
  nvidiaClient = new OpenAI({
    apiKey: nvidiaApiKey,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });
}

export function getNvidiaApiKey(): string {
  return nvidiaApiKey;
}

const PRIMARY_NVIDIA_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b';
const FALLBACK_NVIDIA_MODELS = [
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'nvidia/nemotron-3.5-bolt-e4b',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
];

export async function generateAgentLLM(params: {
  prompt: string;
  systemInstruction?: string;
  jsonResponse?: boolean;
}): Promise<string> {
  const { prompt, systemInstruction, jsonResponse = false } = params;

  // Try NVIDIA NIM API First
  if (nvidiaApiKey) {
    const modelsToTry = [PRIMARY_NVIDIA_MODEL, ...FALLBACK_NVIDIA_MODELS];
    for (const model of modelsToTry) {
      try {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
        if (systemInstruction) {
          messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });

        const requestParams: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
          model,
          messages,
          temperature: 0.2,
        };

        if (jsonResponse) {
          requestParams.response_format = { type: 'json_object' };
        }

        const completion = await nvidiaClient.chat.completions.create(requestParams);
        const text = completion.choices[0]?.message?.content;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } catch (err: any) {
        console.warn(`[NVIDIA API Engine] Model ${model} failed: ${err.message || err}. Trying next model/provider...`);
      }
    }
  }

  // Fallback to Gemini API
  try {
    const geminiParams: any = {
      model: 'gemini-3.8-flash',
      contents: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt,
    };
    if (jsonResponse) {
      geminiParams.config = { responseMimeType: 'application/json' };
    }
    const res = await geminiClient.models.generateContent(geminiParams);
    return res.text || '';
  } catch (err: any) {
    console.error('[LLM Engine] Gemini fallback error:', err);
    throw new Error(`LLM Generation failed: ${err.message}`);
  }
}
