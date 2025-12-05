import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Scheduled function to clear expired queue entries
 * Configure in Supabase Dashboard > Edge Functions > Schedules
 * Cron expression: */15 * * * * (every 15 minutes)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // Clear expired doctor queue entries
    const { data: doctorResult, error: doctorError } = await supabase
      .from("doctor_queue")
      .update({ status: "cleared" })
      .in("status", ["waiting", "called"])
      .lte("expires_at", now)
      .select("id");

    if (doctorError) {
      console.error("Error clearing doctor queue:", doctorError);
    }

    // Clear stale pharmacy queue entries (older than 2 hours)
    const { data: pharmacyResult, error: pharmacyError } = await supabase
      .from("pharmacy_queue")
      .update({ status: "cleared" })
      .in("status", ["waiting", "processing"])
      .lte("created_at", twoHoursAgo)
      .select("id");

    if (pharmacyError) {
      console.error("Error clearing pharmacy queue:", pharmacyError);
    }

    const result = {
      success: true,
      timestamp: now,
      cleared: {
        doctor_queue: doctorResult?.length ?? 0,
        pharmacy_queue: pharmacyResult?.length ?? 0,
      },
    };

    console.log("Cleared expired entries:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Error in clear-expired function:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
