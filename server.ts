import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { MongoClient, ServerApiVersion } from "mongodb";

// MongoDB client setup
let dbClient: MongoClient | null = null;
let communityCollection: any = null;

async function setupDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI environment variable is missing. Database features will not work.");
    return;
  }
  try {
    dbClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await dbClient.connect();
    const db = dbClient.db("lianleme");
    communityCollection = db.collection("community_posts");
    console.log("Successfully connected to MongoDB!");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}

async function startServer() {
  await setupDatabase();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/community/posts", async (req, res) => {
    if (!communityCollection) {
      return res.status(500).json({ error: "Database not configured" });
    }
    try {
      const posts = await communityCollection.find().sort({ createdAt: -1 }).limit(50).toArray();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/community/posts", async (req, res) => {
    if (!communityCollection) {
      return res.status(500).json({ error: "Database not configured" });
    }
    try {
      const post = req.body;
      post.createdAt = Date.now();
      const result = await communityCollection.insertOne(post);
      res.json({ ...post, _id: result.insertedId });
    } catch (error) {
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
