import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const encoder = new TextEncoder();

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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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

    const address = typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).address
      : undefined;
    if (typeof address !== "string" || !address.trim()) {
      return jsonResponse({ error: "invalid_address" }, 400);
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

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
    const plaintext = encoder.encode(address.trim());
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, plaintext));

    const combined = new Uint8Array(iv.length + ciphertext.length);
    combined.set(iv, 0);
    combined.set(ciphertext, iv.length);

    return jsonResponse({ ciphertext_b64: bytesToBase64(combined) });
  } catch (err) {
    console.error("encrypt_address_error", err instanceof Error ? err.message : String(err));
    return jsonResponse({ error: "internal_error" }, 500);
  }
});
