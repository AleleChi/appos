export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { code } = req.query;

  if (!code || typeof code !== "string" || code.length > 255) {
    console.error("[Vercel BFF] Missing or invalid handoff code parameter.");
    return res.redirect("/auth/error?code=session_failed");
  }

  const renderUrl = process.env.RENDER_API_URL || "https://appos.onrender.com";
  const bffSecret = process.env.INTERNAL_BFF_SECRET || "development_bff_secret";

  try {
    const exchangeUrl = `${renderUrl.replace(/\/$/, "")}/api/auth/handoff/exchange`;
    const response = await fetch(exchangeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${bffSecret}`
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Vercel BFF] Handoff exchange failed with status ${response.status}:`, errText);
      return res.redirect("/auth/error?code=session_failed");
    }

    const data = await response.json();
    if (!data.success || !data.sessionToken) {
      console.error("[Vercel BFF] Handoff exchange response missing sessionToken.");
      return res.redirect("/auth/error?code=session_failed");
    }

    const sessionToken = data.sessionToken;
    let maxAgeSeconds = 7 * 24 * 60 * 60; // Default 7 days
    if (data.expiresAt) {
      const expiryMs = new Date(data.expiresAt).getTime();
      const diffSeconds = Math.floor((expiryMs - Date.now()) / 1000);
      if (diffSeconds > 0) {
        maxAgeSeconds = diffSeconds;
      }
    }

    // Set secure same-origin cookie appos_session
    const cookieHeader = `appos_session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
    res.setHeader("Set-Cookie", cookieHeader);

    return res.redirect("/auth/callback?status=success");
  } catch (err) {
    console.error("[Vercel BFF] Handoff complete exception:", err);
    return res.redirect("/auth/error?code=session_failed");
  }
}
