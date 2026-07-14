export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const renderUrl = process.env.RENDER_API_URL || "https://appos.onrender.com";

  try {
    const signupUrl = `${renderUrl.replace(/\/$/, "")}/api/auth/signup`;
    const response = await fetch(signupUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    if (data.success && data.sessionToken) {
      const cookieHeader = `appos_session=${data.sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`;
      res.setHeader("Set-Cookie", cookieHeader);
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error("[Vercel BFF] Signup exception:", err);
    return res.status(500).json({ error: "An unexpected error occurred during registration." });
  }
}
