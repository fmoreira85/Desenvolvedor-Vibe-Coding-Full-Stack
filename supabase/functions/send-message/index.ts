import { createClient } from "npm:@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

type RequestPayload = {
  leadId?: string;
  generatedMessageId?: string | null;
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      return json(401, { error: "Authorization header is required." });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: authorization
          }
        }
      }
    );

    const payload = (await request.json()) as RequestPayload;

    if (!payload.leadId) {
      return json(400, { error: "leadId is required." });
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, workspace_id")
      .eq("id", payload.leadId)
      .single();

    if (leadError || !lead) {
      return json(404, { error: "Lead not found." });
    }

    const messageQuery = supabase
      .from("generated_messages")
      .select("id")
      .eq("lead_id", payload.leadId)
      .order("generated_at", { ascending: false })
      .limit(1);

    const { data: message, error: messageError } = payload.generatedMessageId
      ? await supabase
          .from("generated_messages")
          .select("id")
          .eq("id", payload.generatedMessageId)
          .eq("lead_id", payload.leadId)
          .single()
      : await messageQuery.single();

    if (messageError || !message) {
      return json(404, { error: "No generated message available for this lead." });
    }

    const { data: targetStage, error: stageError } = await supabase
      .from("funnel_stages")
      .select("id")
      .eq("workspace_id", lead.workspace_id)
      .eq("name", "Tentando Contato")
      .order("order", { ascending: true })
      .limit(1)
      .single();

    if (stageError || !targetStage) {
      return json(404, { error: 'Stage "Tentando Contato" not found for this workspace.' });
    }

    const { error: markSentError } = await supabase
      .from("generated_messages")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", message.id);

    if (markSentError) {
      return json(400, { error: markSentError.message });
    }

    const { error: moveLeadError } = await supabase
      .from("leads")
      .update({
        stage_id: targetStage.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", payload.leadId);

    if (moveLeadError) {
      return json(400, { error: moveLeadError.message });
    }

    const { data: authUser } = await supabase.auth.getUser();

    await supabase.from("activity_logs").insert({
      lead_id: payload.leadId,
      workspace_id: lead.workspace_id,
      user_id: authUser.user?.id ?? null,
      action: "message.sent",
      metadata: {
        generatedMessageId: message.id,
        movedToStageId: targetStage.id
      }
    });

    return json(200, {
      generatedMessageId: message.id,
      movedToStageId: targetStage.id
    });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Unexpected edge function error."
    });
  }
});
