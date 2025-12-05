import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const encoder = new TextEncoder();

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
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

    const nik = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>).nik : undefined;
    if (typeof nik !== "string" || !/^\d{16}$/.test(nik.trim())) {
      return jsonResponse({ error: "invalid_nik" }, 400);
    }
    const nikBytes = encoder.encode(nik.trim());

    const pepperHex = Deno.env.get("EMR_NIK_PEPPER");
    if (!pepperHex) {
      return jsonResponse({ error: "server_not_configured" }, 500);
    }

    let pepperBytes: Uint8Array;
    try {
      pepperBytes = hexToBytes(pepperHex);
    } catch (_) {
      return jsonResponse({ error: "invalid_pepper" }, 500);
    }
    if (pepperBytes.length === 0) {
      return jsonResponse({ error: "invalid_pepper" }, 500);
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));

    const lookupInput = new Uint8Array(pepperBytes.length + nikBytes.length);
    lookupInput.set(pepperBytes, 0);
    lookupInput.set(nikBytes, pepperBytes.length);
    const nikHashLookup = toHex(await sha256(lookupInput));

    const saltedInput = new Uint8Array(pepperBytes.length + nikBytes.length + salt.length);
    saltedInput.set(pepperBytes, 0);
    saltedInput.set(nikBytes, pepperBytes.length);
    saltedInput.set(salt, pepperBytes.length + nikBytes.length);
    const nikHash = toHex(await sha256(saltedInput));

    return jsonResponse({
      nik_hash_lookup: nikHashLookup,
      nik_hash: nikHash,
      nik_salt: toHex(salt),
    });
  } catch (err) {
    console.error("hash_nik_error", err instanceof Error ? err.message : String(err));
    return jsonResponse({ error: "internal_error" }, 500);
  }
});
