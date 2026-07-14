export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  let sessionToken = req.cookies?.appos_session;
  if (!sessionToken && req.headers.cookie) {
    const rawCookies = req.headers.cookie.split(";");
    for (const rawCookie of rawCookies) {
      const parts = rawCookie.split("=");
      const name = parts[0]?.trim();
      if (name === "appos_session") {
        sessionToken = decodeURIComponent(parts.slice(1).join("=").trim());
        break;
      }
    }
  }

  if (!sessionToken) {
    return res.status(401).json({ authenticated: false, user: null });
  }

  const renderUrl = process.env.RENDER_API_URL || "https://appos.onrender.com";
  const bffSecret = process.env.INTERNAL_BFF_SECRET || "development_bff_secret";

  try {
    const introspectUrl = `${renderUrl.replace(/\/$/, "")}/api/auth/session/introspect`;
    const response = await fetch(introspectUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${bffSecret}`
      },
      body: JSON.stringify({ sessionToken })
    });

    if (!response.ok) {
      return res.status(401).json({ authenticated: false, user: null });
    }

    const data = await response.json();
    if (!data.authenticated) {
      return res.status(401).json({ authenticated: false, user: null });
    }

    return res.status(200).json({
      authenticated: true,
      user: data.user
    });
  } catch (err) {
    console.error("[Vercel BFF] Introspection error:", err);
    return res.status(500).json({ error: "Unable to complete request" });
  }
}
