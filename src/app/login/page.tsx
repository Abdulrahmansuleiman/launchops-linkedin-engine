"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <Lightbulb className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-xl">LinkedIn Ops Engine</CardTitle>
          <p className="text-sm text-gray-400 mt-1">Sign in to your growth command center</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email</label>
            <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Password</label>
            <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button className="w-full" onClick={() => window.location.href = "/"}>
            Sign In
          </Button>
          <p className="text-xs text-center text-gray-600">
            Default: admin@linkedinops.com / admin123
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
