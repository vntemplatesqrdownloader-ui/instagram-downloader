export default async function handler(req, res) {
  try {
    const { url, filename } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL required" });
    }

    const videoResponse = await fetch(url);

    if (!videoResponse.ok) {
      return res.status(400).json({ error: "Unable to download media" });
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename || "instagram-video.mp4"}"`
    );

    const buffer = Buffer.from(await videoResponse.arrayBuffer());
    res.send(buffer);

  } catch (err) {
    console.error("PROXY ERROR:", err.message);
    res.status(500).json({ error: "Proxy server error" });
  }
}