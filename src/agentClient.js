const AGENT_URL = import.meta.env.VITE_AGENT_URL;

let previousResponseId = null;

function extractOutputText(item) {
  if (!item.content) return "";
  return item.content
    .filter((c) => c.type === "output_text")
    .map((c) => c.text)
    .join("");
}

async function* parseSSEStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      const dataLines = rawEvent
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim());
      if (!dataLines.length) continue;

      const data = dataLines.join("\n");
      if (data === "[DONE]") continue;

      try {
        yield JSON.parse(data);
      } catch {
        // ignore malformed/partial SSE frames
      }
    }
  }
}

/**
 * Run one turn of the LeadAgent agent over the Foundry Responses protocol.
 *
 * callbacks:
 *   - onText(fullText): streamed assistant text, called with the accumulated
 *     text so far each time new text arrives
 *   - onToolResult({ name, args, result }): called once a function-call tool
 *     result is available
 *   - onDone(): called when the run completes successfully
 *   - onError(message): called on failure
 */
export async function runAgentTurn(userMessage, callbacks = {}) {
  const { onText = () => {}, onToolResult = () => {}, onDone = () => {}, onError = () => {} } = callbacks;

  try {
    const response = await fetch(AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: userMessage,
        previous_response_id: previousResponseId,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Agent request failed: ${response.status} ${response.statusText}`);
    }

    const textByItemId = new Map();
    const callArgsById = new Map();

    for await (const event of parseSSEStream(response)) {
      switch (event.type) {
        case "response.output_text.delta": {
          const itemId = event.item_id;
          const prev = textByItemId.get(itemId) || "";
          const next = prev + event.delta;
          textByItemId.set(itemId, next);
          onText(next);
          break;
        }
        case "response.output_item.done": {
          const item = event.item;
          if (item?.type === "function_call") {
            callArgsById.set(item.call_id, { name: item.name, args: JSON.parse(item.arguments) });
          } else if (item?.type === "function_call_output") {
            const call = callArgsById.get(item.call_id);
            if (call) {
              const result = JSON.parse(item.output);
              onToolResult({ name: call.name, args: call.args, result });
            }
          }
          break;
        }
        case "response.completed": {
          previousResponseId = event.response.id;
          onDone();
          break;
        }
        case "response.incomplete": {
          previousResponseId = event.response.id;
          onError(event.response.incomplete_details?.reason || "Response incomplete");
          break;
        }
        default:
          break;
      }
    }
  } catch (err) {
    onError(err.message || String(err));
  }
}
