import { NextRequest, NextResponse } from "next/server";

// POST /api/slack/events - Slack event handler (URL verification + events)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // URL verification challenge
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Handle events
    if (body.type === "event_callback") {
      const event = body.event;

      // Ignore bot messages
      if (event.bot_id) {
        return NextResponse.json({ ok: true });
      }

      // Handle direct messages or mentions
      if (event.type === "message" || event.type === "app_mention") {
        // Acknowledge immediately — actual processing can be async
        console.log("Slack event received:", event.type, event.text);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Slack events error:", error);
    return NextResponse.json({ ok: true });
  }
}
