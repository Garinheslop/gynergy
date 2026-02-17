export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createServiceClient } from "@lib/supabase-server";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: boolean;
    environment: boolean;
  };
  responseTime: number;
}

export async function GET(): Promise<NextResponse<HealthCheck>> {
  const startTime = Date.now();

  const checks = {
    database: false,
    environment: false,
  };

  // Check environment variables
  checks.environment = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Check database connectivity
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("users").select("id").limit(1);
    checks.database = !error;
  } catch {
    checks.database = false;
  }

  const allHealthy = Object.values(checks).every(Boolean);
  const someHealthy = Object.values(checks).some(Boolean);

  const healthCheck: HealthCheck = {
    status: allHealthy ? "healthy" : someHealthy ? "degraded" : "unhealthy",
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    checks,
    responseTime: Date.now() - startTime,
  };

  return NextResponse.json(healthCheck, {
    status: allHealthy ? 200 : someHealthy ? 200 : 503,
  });
}
