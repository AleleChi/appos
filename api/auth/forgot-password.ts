export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const renderUrl = process.env.RENDER_API_URL || "https://appos.onrender.com";

  try {
    const forwardUrl = `${renderUrl.replace(/\/$/, "")}/api/auth/forgot-password`;
    const response = await fetch(forwardUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error("[Vercel BFF] Forgot password exception:", err);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
}
