import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";

const schema = z.object({
  message: z.string().min(10).max(5000),
});

export async function POST(request: Request) {
  try {
    const env = getServerEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const json = await request.json();
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid feedback message" }, { status: 400 });
    }

    const { error } = await supabase.from("feedback").insert({
      user_id: null,
      message: parsed.data.message,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}