import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";

const schema = z.object({
  message: z.string().min(10).max(5000),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid feedback message" }, { status: 400 });
    }

    const env = getServerEnv();

    if (!env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    const resendUrl = "https://api.resend.com/emails";
    const emailResponse = await fetch(resendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "feedback@pumpiq.dev",
        to: "leefarah45@gmail.com",
        subject: "New PumpIQ Feedback Submission",
        html: `
          <h2>New Feedback from PumpIQ</h2>
          <p><strong>Message:</strong></p>
          <p>${parsed.data.message.replace(/\n/g, "<br>")}</p>
          <hr>
          <p><em>Submitted at: ${new Date().toISOString()}</em></p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend error:", errorData);
      throw new Error(`Resend API error: ${emailResponse.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}