/**
 * Lexora AI Service
 * Uses OpenRouter API for conversational AI chat (claude-3-haiku)
 * Uses Gemini API for deep topic research/explanations
 */

const OPENROUTER_KEY = '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';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

const GEMINI_API_KEY = 'AIzaSyDrFXuZI1k_Fj0uYw9ZhPZ98Aryd3wOVRA';
const GEMINI_BASE = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── OpenRouter: Real-Time Streaming Chat ─────────────────────────────────────
const SYSTEM_PROMPT = `You are Lexora AI, a brilliant and friendly knowledge companion on the Lexora platform.
You help users explore topics deeply, answer questions, suggest related topics to explore,
and engage in meaningful intellectual conversations. Be concise but insightful.
Format responses with short paragraphs. Keep answers under 300 words unless asked for more.`;

export async function streamChatWithAI(messages, onChunk, signal) {
  const payload = {
    model: 'anthropic/claude-3-haiku',
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    ],
  };

  const res = await fetch(OPENROUTER_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Lexora',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenRouter error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.replace(/^data:\s?/, '').trim();
      if (!trimmed || trimmed === '[DONE]') continue;
      try {
        const json = JSON.parse(trimmed);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) onChunk(delta);
      } catch { /* ignore parse errors on incomplete chunks */ }
    }
  }
}

// ─── Non-streaming fallback ───────────────────────────────────────────────────
export async function chatWithAI(messages) {
  let fullText = '';
  await streamChatWithAI(messages, chunk => { fullText += chunk; });
  return fullText;
}

// ─── Gemini: Research / Topic Explanation ─────────────────────────────────────
export async function explainTopic(topic) {
  const prompt = `You are Lexora AI, a knowledgeable assistant on a knowledge-sharing platform.

Give a clear, engaging, and informative explanation of "${topic}" in 3-4 paragraphs. 
Cover: what it is, why it matters, key concepts, and an interesting recent development.
Write in a way that's approachable yet intellectually stimulating. Use plain text without markdown.`;

  const res = await fetch(GEMINI_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini error ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
