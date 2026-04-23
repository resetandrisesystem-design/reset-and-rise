import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prompt, journalText } = await request.json();

  if (!journalText?.trim()) {
    return NextResponse.json({ error: "No journal text provided" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        system: `You are a warm, empathetic wellness companion for Reset & Rise™ — a planner system created for busy women, especially those rebuilding after burnout, trauma, or major life transitions.

Your role is to respond to the user's journal entry with:
1. Genuine, compassionate acknowledgement of what they shared (2-3 sentences)
2. A meaningful insight or gentle reframe that helps them see their situation with more clarity or self-compassion (2-3 sentences)
3. One specific, actionable "reset action" they could take today — small and achievable
4. A closing affirmation that feels personal to what they wrote

Tone: warm, wise, non-clinical. Like a trusted friend who has been through it herself. Use "you" not "one". Keep the total response under 200 words. Do not use bullet points — write in flowing paragraphs.`,
        messages: [
          {
            role: "user",
            content: `Journal prompt I was given: "${prompt || "Free write"}"

What I wrote:
${journalText}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "I hear you. Your words matter. Take a breath — you are doing more than you know.";

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("AI journal error:", error);
    return NextResponse.json({
      response: "I hear you. Your words matter. Take a breath — you are doing more than you know. ✦",
    });
  }
}
