import { adminDb, adminMessaging } from "@/lib/firebase/admin";

export async function sendPushToUser(uid: string, title: string, body: string, url?: string) {
  const userDoc = await adminDb.collection("users").doc(uid).get();
  const tokens: string[] = userDoc.data()?.fcmTokens ?? [];
  if (tokens.length === 0) return;

  const response = await adminMessaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: url ? { url } : undefined,
  });

  // Clean up tokens that are no longer valid (uninstalled app, revoked permission, etc.)
  const invalidTokens = response.responses
    .map((r, i) => (!r.success ? tokens[i] : null))
    .filter((t): t is string => t !== null);

  if (invalidTokens.length > 0) {
    await adminDb.collection("users").doc(uid).update({
      fcmTokens: tokens.filter((t) => !invalidTokens.includes(t)),
    });
  }
}