import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyIdToken(request.headers.get("authorization"));
    return NextResponse.json({
      valid: true,
      uid: decoded.uid,
      email: decoded.email,
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid or expired token" }, { status: 401 });
  }
}