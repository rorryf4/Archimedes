import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api-response";

export async function GET() {
  return NextResponse.json(
    apiSuccess({
      status: "ok",
      timestamp: new Date().toISOString(),
    })
  );
}
