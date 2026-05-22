import { MongoClient, MongoClientOptions, ServerApiVersion, ObjectId } from 'mongodb';
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
    const communityCollection = db.collection<any>("community_posts");

    if (req.method === 'POST') {
      const { postId } = req.query;
      if (!postId || typeof postId !== 'string') {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      const comment = req.body;
      comment.id = new ObjectId().toString();
      comment.createdAt = Date.now();
      
      const result = await communityCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $push: { comments: comment } } as any
      );
      
      if (result.modifiedCount === 1) {
        return res.status(200).json(comment);
      } else {
        return res.status(404).json({ error: "Post not found" });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error("MongoDB error:", error);
    return res.status(500).json({ error: "Database operation failed" });
  }
}
