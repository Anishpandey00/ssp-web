// Talks to Ollama (https://ollama.com), which runs the AI model locally.
// Ollama has no API key: anything that can reach OLLAMA_URL can use it.

export class AiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Sends one chat request and returns the model's answer parsed as JSON.
// `schema` is a JSON schema; Ollama makes the model answer in that shape.
export async function chatJson({ url, model, system, prompt, schema, timeoutMs = 120_000 }) {
  let res;
  try {
    res = await fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        format: schema,
        options: { temperature: 0.4 },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err.name === "TimeoutError") {
      throw new AiError(504, "The AI assistant took too long to answer. Please try again.");
    }
    throw new AiError(503, "The AI assistant is offline right now. Please try again later.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 404) {
      // Ollama answers 404 when the model has not been downloaded.
      console.error(`[ai-service] Model "${model}" not found. Run: ollama pull ${model}`);
      throw new AiError(503, "The AI model is not installed yet. Please ask the admin to set it up.");
    }
    console.error("[ai-service] Ollama error:", res.status, data?.error);
    throw new AiError(502, "The AI assistant had a problem. Please try again.");
  }

  try {
    return JSON.parse(data.message.content);
  } catch {
    throw new AiError(502, "The AI gave an answer we couldn't read. Please try again.");
  }
}
