import { MongoClient, MongoClientOptions, ServerApiVersion } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  const options: MongoClientOptions = {
    appName: "devrel.vercel.integration",
    maxIdleTimeMS: 5000,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  };

  client = new MongoClient(uri, options);
  attachDatabasePool(client);
  clientPromise = client.connect();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!clientPromise) {
    return res.status(500).json({ error: "Database not configured" });
  }

  try {
    const dbClient = await clientPromise;
    const db = dbClient.db("lianleme");
    const communityCollection = db.collection("community_posts");

    if (req.method === 'GET') {
      const posts = await communityCollection.find().sort({ createdAt: -1 }).limit(50).toArray();
      return res.status(200).json(posts);
    } else if (req.method === 'POST') {
      const post = req.body;
      post.createdAt = Date.now();
      const result = await communityCollection.insertOne(post);
      return res.status(200).json({ ...post, _id: result.insertedId });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("MongoDB error:", error);
    return res.status(500).json({ error: "Database operation failed" });
  }
}
