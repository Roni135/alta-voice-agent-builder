import OpenAI from 'openai';

const globalForOpenAI = globalThis;

// Lazy: constructing the client eagerly at import time throws if
// OPENAI_API_KEY isn't set yet, which breaks `next build`'s route
// analysis before any request is ever made.
export function getOpenAI() {
  if (!globalForOpenAI.__openai) {
    globalForOpenAI.__openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return globalForOpenAI.__openai;
}
