import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_ANTI_LOGIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_ANTI_LOGIC_SUPABASE_PUBLISHABLE_KEY,
  );

  const body = {
    service: "anti-logic",
    status: "ok",
    checkedAt: new Date().toISOString(),
    configuration: {
      authentication: supabaseConfigured ? "configured" : "not_configured",
      derivMarketData: "public_client_websocket",
      telegramDelivery: process.env.TELEGRAM_BOT_TOKEN ? "server_secret_configured" : "not_configured",
      tradeExecution: "disabled",
    },
    note: "This endpoint reports application configuration only. It does not verify third-party uptime, account authorization, or trading readiness.",
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
