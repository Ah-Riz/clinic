import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error("invalid-hex");
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function base64ToBytes(b64: string): Uint8Array {
  try {
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  } catch (_) {
    throw new Error("invalid-base64");
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "method_not_allowed" }, 405);
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch (_) {
      return jsonResponse({ error: "invalid_json" }, 400);
    }

    const ciphertextB64 = typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).ciphertext_b64
      : undefined;
    if (typeof ciphertextB64 !== "string" || !ciphertextB64.trim()) {
      return jsonResponse({ error: "invalid_ciphertext" }, 400);
    }

    const keyHex = Deno.env.get("EMR_ADDRESS_KEY");
    if (!keyHex) {
      return jsonResponse({ error: "server_not_configured" }, 500);
    }

    let keyBytes: Uint8Array;
    try {
      keyBytes = hexToBytes(keyHex);
    } catch (_) {
      return jsonResponse({ error: "invalid_key" }, 500);
    }
    if (keyBytes.length !== 32) {
      return jsonResponse({ error: "invalid_key" }, 500);
    }

    let combined: Uint8Array;
    try {
      combined = base64ToBytes(ciphertextB64.trim());
    } catch (_) {
      return jsonResponse({ error: "invalid_ciphertext" }, 400);
    }
    if (combined.length <= 12) {
      return jsonResponse({ error: "invalid_ciphertext" }, 400);
    }

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
    let plaintextBytes: ArrayBuffer;
    try {
      plaintextBytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ciphertext);
    } catch (_) {
      return jsonResponse({ error: "decryption_failed" }, 400);
    }

    const plaintext = decoder.decode(new Uint8Array(plaintextBytes));

    return jsonResponse({ address: plaintext });
  } catch (err) {
    console.error("decrypt_address_error", err instanceof Error ? err.message : String(err));
    return jsonResponse({ error: "internal_error" }, 500);
  }
});
