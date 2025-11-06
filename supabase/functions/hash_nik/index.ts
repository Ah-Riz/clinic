// Deno Deploy Edge Function: hash_nik
// Input: { nik: string }
// Output: { hash: string, salt: string }
// Mechanics: SHA-256(pepper || nik || salt) with random 16-byte salt; outputs hex strings

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) throw new Error("Invalid hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    const { nik } = await req.json();
    if (!nik || typeof nik !== "string") return new Response("Invalid payload", { status: 400 });

    const pepperHex = Deno.env.get("EMR_NIK_PEPPER");
    if (!pepperHex) return new Response("Server not configured", { status: 500 });
    const pepper = hexToBytes(pepperHex);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const nikBytes = encoder.encode(nik);

    const concat = new Uint8Array(pepper.length + nikBytes.length + salt.length);
    concat.set(pepper, 0);
    concat.set(nikBytes, pepper.length);
    concat.set(salt, pepper.length + nikBytes.length);

    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", concat));

    return new Response(
      JSON.stringify({ hash: toHex(digest), salt: toHex(salt) }),
      { headers: { "content-type": "application/json" } },
    );
  } catch (e) {
    return new Response("Error", { status: 500 });
  }
});
