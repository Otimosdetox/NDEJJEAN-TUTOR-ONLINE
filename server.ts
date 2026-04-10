import express, { Request, Response } from "express";
import path from "path";
import dotenv from 'dotenv';
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Health check
app.get("/api/health", (_req: Request, res: Response) => res.json({ status: "ok" }));

// OpenRouter Proxy
app.post("/api/chat", async (req: Request, res: Response) => {
  console.log("Received chat request");
  const { messages, stream, model } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is missing");
    return res.status(500).json({ 
      error: "API Configuration Error", 
      message: "OPENROUTER_API_KEY is not set. Please add it to your environment variables." 
    });
  }
  
  try {
    const referer = process.env.APP_URL || req.headers.referer || "http://localhost:3000";
    console.log(`Using referer: ${referer}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": referer,
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
        const errorText = await response.text();
        console.error(`OpenRouter error (${response.status}):`, errorText);
        try {
          const errorData = JSON.parse(errorText);
          return res.status(response.status).json(errorData);
        } catch (e) {
          return res.status(response.status).json({ error: "OpenRouter Error", message: errorText });
        }
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

// Setup Vite or Static serving
async function setup() {
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return;
      
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          res.status(404).send("Frontend build not found. Please run 'npm run build' first.");
        }
      });
    });
  }

  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

setup();

export default app;
