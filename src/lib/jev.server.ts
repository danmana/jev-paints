import 'server-only';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import type { Question } from './prompts';

/** Jev's price per million input tokens (output is free). */
export const PRICE_PER_M_INPUT = 0.042;

let client: TypeSafeClient | null = null;

function typesafe(): TypeSafeClient {
  const apiKey = process.env.TYPESAFE_AI_API_KEY ?? process.env.TYPESAFE_API_KEY;
  if (!apiKey) throw new Error('TYPESAFE_AI_API_KEY is not set');
  client ??= new TypeSafeClient({ apiKey, timeout: 30_000, retry: { maxRetries: 2 }, logLevel: 'error' });
  return client;
}

export interface ChoiceAnswer {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}
export interface NoulAnswer {
  type: 'noul';
  noul: number;
}
export type Answer = ChoiceAnswer | NoulAnswer;

export interface JevResult {
  answers: Record<string, Answer>;
  inputTokens: number;
  ms: number;
}

export async function askJev(state: unknown, questions: Record<string, Question>): Promise<JevResult> {
  const started = performance.now();
  const result = await typesafe().systemOne({ state: state as never, questions: questions as never, model: process.env.JEV_MODEL ?? 'jev-latest' });
  return {
    answers: result.answers as unknown as Record<string, Answer>,
    inputTokens: result.usage?.input_tokens ?? 0,
    ms: Math.round(performance.now() - started),
  };
}

export function choice(answers: Record<string, Answer>, id: string): ChoiceAnswer {
  const a = answers[id];
  if (!a || a.type !== 'choice') throw new Error(`Jev returned no choice for "${id}"`);
  return a;
}

export function noul(answers: Record<string, Answer>, id: string): number {
  const a = answers[id];
  if (!a || a.type !== 'noul') throw new Error(`Jev returned no noul for "${id}"`);
  return a.noul;
}
