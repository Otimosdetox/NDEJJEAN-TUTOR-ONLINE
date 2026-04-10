import express, { Request, Response } from "express";
import path from "path";
// import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from "vite";

dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check
app.get("/api/health", (_req: Request, res: Response) => res.json({ status: "ok" }));

// OpenRouter Proxy
app.post("/api/chat", async (req: Request, res: Response) => {
  const { messages, stream, model } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set in environment variables");
    return res.status(500).json({ error: "Server configuration error: API key missing" });
  }
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "NDEJJEAN AI TUTOR",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model || "google/gemini-2.0-flash-001",
        messages: messages,
        stream: stream || false
      })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json(errorData);
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const reader = response.body?.getReader();
      if (!reader) {
        return res.status(500).json({ error: "Failed to get reader from OpenRouter" });
      }

      while (true) {
        try {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        } catch (readError) {
          console.error("Stream read error:", readError);
          break;
        }
      }
      return res.end();
    } else {
      const data = await response.json();
      return res.json(data);
    }
  } catch (error) {
    console.error("OpenRouter Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to connect to OpenRouter" });
    }
    return res.end();
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not running as a serverless function
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
