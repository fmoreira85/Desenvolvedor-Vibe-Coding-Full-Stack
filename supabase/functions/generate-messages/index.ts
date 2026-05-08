import { createClient } from "npm:@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";
import { generateLeadMessages } from "../_shared/messages.ts";

type RequestPayload = {
  campaignId?: string;
  leadId?: string;
  reason?: "manual" | "triggered";
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

    if (!payload.campaignId || !payload.leadId) {
      return json(400, { error: "campaignId and leadId are required." });
    }

    const [{ data: campaign, error: campaignError }, { data: lead, error: leadError }] =
      await Promise.all([
        supabase
          .from("campaigns")
          .select("id, workspace_id, name, context, prompt")
          .eq("id", payload.campaignId)
          .single(),
        supabase
          .from("leads")
          .select("id, workspace_id, name, company, role, phone, lead_source, notes")
          .eq("id", payload.leadId)
          .single()
      ]);

    if (campaignError || !campaign) {
      return json(404, { error: "Campaign not found." });
    }

    if (leadError || !lead) {
      return json(404, { error: "Lead not found." });
    }

    if (campaign.workspace_id !== lead.workspace_id) {
      return json(400, { error: "Lead and campaign must belong to the same workspace." });
    }

    const { data: customValues, error: customValuesError } = await supabase
      .from("lead_custom_values")
      .select("value, custom_fields!inner(name)")
      .eq("lead_id", payload.leadId);

    if (customValuesError) {
      return json(400, { error: customValuesError.message });
    }

    const generated = await generateLeadMessages({
      campaign: {
        context: campaign.context,
        prompt: campaign.prompt
      },
      lead: {
        name: lead.name,
        company: lead.company,
        role: lead.role,
        phone: lead.phone,
        leadSource: lead.lead_source,
        notes: lead.notes
      },
      customFields: (customValues ?? []).map((item) => ({
        name: (item.custom_fields as { name: string }).name,
        value: item.value
      }))
    });

    const { data: inserted, error: insertError } = await supabase
      .from("generated_messages")
      .insert({
        lead_id: payload.leadId,
        campaign_id: payload.campaignId,
        messages: generated.messages
      })
      .select("id, lead_id, campaign_id, messages, generated_at, sent_at")
      .single();

    if (insertError || !inserted) {
      return json(400, { error: insertError?.message ?? "Could not insert generated message." });
    }

    const { data: authUser } = await supabase.auth.getUser();

    await supabase.from("activity_logs").insert({
      lead_id: payload.leadId,
      workspace_id: lead.workspace_id,
      user_id: authUser.user?.id ?? null,
      action: "message.generated",
      metadata: {
        campaignId: payload.campaignId,
        provider: generated.provider,
        model: generated.model,
        reason: payload.reason ?? "manual"
      }
    });

    return json(201, {
      id: inserted.id,
      leadId: inserted.lead_id,
      campaignId: inserted.campaign_id,
      messages: inserted.messages,
      generatedAt: inserted.generated_at,
      sentAt: inserted.sent_at,
      provider: generated.provider,
      model: generated.model
    });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Unexpected edge function error."
    });
  }
});
