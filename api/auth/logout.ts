export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const sessionToken = req.cookies?.appos_session;
  const renderUrl = process.env.RENDER_API_URL || "https://appos.onrender.com";

  if (sessionToken) {
    try {
      // Proxy the logout call to Render
      await fetch(`${renderUrl.replace(/\/$/, "")}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `appos_session=${sessionToken}`
        }
      });
    } catch (err) {
      console.error("[Vercel BFF] Logout proxy warning:", err);
    }
  }

  // Clear cookie from the Vercel host
  res.setHeader(
    "Set-Cookie",
    "appos_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  );

  return res.status(200).json({ success: true, message: "Logged out successfully." });
}
