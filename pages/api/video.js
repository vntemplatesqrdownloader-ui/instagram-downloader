import axios from "axios";

export default async function handler(req, res) {
  try {
    const { postUrl } = req.query;

    if (!postUrl) {
      return res.status(400).json({ error: "Instagram URL required" });
    }

    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

    if (!RAPIDAPI_KEY) {
      return res.status(400).json({
        error: "Missing RAPIDAPI_KEY in .env.local"
      });
    }

    const response = await axios.get(
      "https://instagram-post-reels-stories-downloader-api.p.rapidapi.com/instagram/",
      {
        params: { url: postUrl },
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "instagram-post-reels-stories-downloader-api.p.rapidapi.com"
        }
      }
    );

    const data = response.data;

    if (!data || !data.status || !data.result || data.result.length === 0) {
      return res.status(400).json({
        error: "Unable to fetch video from Instagram"
      });
    }

    const media = data.result[0];

    return res.status(200).json({
      status: "success",
      data: {
        filename: `instagram-${Date.now()}.mp4`,
        videoUrl: media.url,
        thumbnail: media.thumb,
        size: media.size,
        type: media.type
      }
    });

  } catch (error) {
    console.error("API ERROR:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Server error"
    });
  }
}