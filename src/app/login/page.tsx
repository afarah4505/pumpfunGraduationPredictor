import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  return (
    <div className="mx-auto mt-10 max-w-xl">
      <Card className="space-y-4">
        <CardTitle className="text-2xl">Authentication is currently disabled</CardTitle>
        <CardDescription>Google sign-in has been skipped for now. Continue directly to the dashboard.</CardDescription>
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </Card>
    </div>
  );
}