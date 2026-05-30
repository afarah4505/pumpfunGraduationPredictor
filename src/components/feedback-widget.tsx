"use client";

import { FormEvent, useState } from "react";
import { MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("Unable to submit feedback");
      }

      setMessage("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <Card className="w-[320px] space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Share Feedback</CardTitle>
              <CardDescription>Feature requests, bug reports, suggestions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            <Textarea
              required
              minLength={10}
              placeholder="Tell us what would make this better for your workflow"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />

            <Button className="w-full" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Submitting..." : "Submit Feedback"}
            </Button>

            {status === "success" && <p className="text-xs text-primary">Feedback submitted successfully.</p>}
            {status === "error" && <p className="text-xs text-danger">Could not submit feedback. Try again.</p>}
          </form>
        </Card>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <MessageSquareWarning className="mr-2 h-4 w-4" />
          Feedback
        </Button>
      )}
    </div>
  );
}