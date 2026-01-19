"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Batch {
  id: string;
  name: string;
  prompt: string;
  platforms: string[];
  status: string;
  createdAt: string;
  brand: { id: string; name: string };
  offer: { id: string; name: string };
  topic: { id: string; name: string } | null;
  _count: { assets: number };
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/batches")
      .then((res) => res.json())
      .then((data) => {
        setBatches(data.batches);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading batches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl">🚀</Link>
            <h1 className="text-xl font-bold">Content Batches</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/vault" className="text-gray-600 hover:text-purple-700">Vault</Link>
            <Link href="/batches" className="text-purple-600 font-medium">Batches</Link>
            <Link href="/assets" className="text-gray-600 hover:text-purple-700">Assets</Link>
            <Link href="/calendar" className="text-gray-600 hover:text-purple-700">Calendar</Link>
            <Link href="/analytics" className="text-gray-600 hover:text-purple-700">Analytics</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Your Batches</h2>
            <p className="text-gray-500">Create and manage content batches</p>
          </div>
          <Link href="/batches/new">
            <Button>Create New Batch</Button>
          </Link>
        </div>

        {batches.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">No batches yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first content batch to start generating viral content
              </p>
              <Link href="/batches/new">
                <Button>Create Your First Batch</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {batches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function BatchCard({ batch }: { batch: Batch }) {
  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    GENERATING: "bg-yellow-100 text-yellow-700",
    SCORING: "bg-blue-100 text-blue-700",
    REVIEW: "bg-purple-100 text-purple-700",
    SCHEDULED: "bg-green-100 text-green-700",
    PUBLISHED: "bg-green-200 text-green-800",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <Card>
      <CardContent className="py-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Link href={`/batches/${batch.id}`}>
                <h3 className="text-lg font-semibold hover:text-purple-600">
                  {batch.name}
                </h3>
              </Link>
              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[batch.status] ?? statusColors.DRAFT}`}>
                {batch.status}
              </span>
            </div>
            <p className="text-gray-600 mb-4 line-clamp-2">{batch.prompt}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Brand: {batch.brand.name}</span>
              <span>•</span>
              <span>Offer: {batch.offer.name}</span>
              <span>•</span>
              <span>{batch._count.assets} assets</span>
              <span>•</span>
              <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              {batch.platforms.map((platform) => (
                <PlatformBadge key={platform} platform={platform} />
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              {batch.status === "DRAFT" && (
                <Button size="sm" variant="outline">
                  Generate
                </Button>
              )}
              <Link href={`/batches/${batch.id}`}>
                <Button size="sm" variant="ghost">
                  View
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    PINTEREST: "📌",
    INSTAGRAM: "📸",
    TIKTOK: "🎵",
    YOUTUBE: "▶️",
    LINKEDIN: "💼",
  };

  return (
    <span className="text-lg" title={platform}>
      {icons[platform] ?? "📱"}
    </span>
  );
}
