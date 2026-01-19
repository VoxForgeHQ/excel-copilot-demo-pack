"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Asset {
  id: string;
  platform: string;
  assetType: string;
  status: string;
  score: {
    quality?: { overall: number; passed: boolean };
    risk?: { passed: boolean; riskLevel: string };
  } | null;
  createdAt: string;
  batch: { id: string; name: string };
  variants: Array<{ id: string; variantKey: string }>;
  _count: { schedules: number; posts: number };
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [platformFilter, setPlatformFilter] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (platformFilter) params.set("platform", platformFilter);

    fetch(`/api/assets?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setAssets(data.assets);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter, platformFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading assets...</div>
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
            <h1 className="text-xl font-bold">Assets</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/vault" className="text-gray-600 hover:text-purple-700">Vault</Link>
            <Link href="/batches" className="text-gray-600 hover:text-purple-700">Batches</Link>
            <Link href="/assets" className="text-purple-600 font-medium">Assets</Link>
            <Link href="/calendar" className="text-gray-600 hover:text-purple-700">Calendar</Link>
            <Link href="/analytics" className="text-gray-600 hover:text-purple-700">Analytics</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCORING">Scoring</option>
            <option value="LOW_SCORE">Low Score</option>
            <option value="APPROVED">Approved</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
          </select>

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Platforms</option>
            <option value="PINTEREST">Pinterest</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TIKTOK">TikTok</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="LINKEDIN">LinkedIn</option>
          </select>
        </div>

        {assets.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-xl font-semibold mb-2">No assets found</h3>
              <p className="text-gray-500 mb-6">
                Generate content in a batch to see assets here
              </p>
              <Link href="/batches">
                <Button>Go to Batches</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function AssetCard({ asset }: { asset: Asset }) {
  const platformEmoji: Record<string, string> = {
    PINTEREST: "📌",
    INSTAGRAM: "📸",
    TIKTOK: "🎵",
    YOUTUBE: "▶️",
    LINKEDIN: "💼",
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SCORING: "bg-blue-100 text-blue-700",
    LOW_SCORE: "bg-yellow-100 text-yellow-700",
    REGENERATING: "bg-orange-100 text-orange-700",
    APPROVED: "bg-green-100 text-green-700",
    SCHEDULED: "bg-purple-100 text-purple-700",
    PUBLISHED: "bg-green-200 text-green-800",
    FAILED: "bg-red-100 text-red-700",
  };

  const qualityScore = asset.score?.quality?.overall ?? 0;
  const riskPassed = asset.score?.risk?.passed ?? true;

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{platformEmoji[asset.platform] ?? "📱"}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{asset.platform}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{asset.assetType}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[asset.status] ?? ""}`}>
                  {asset.status}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Batch: {asset.batch.name} • {asset.variants.length} variants
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Score */}
            <div className="text-center">
              <div className={`text-2xl font-bold ${qualityScore >= 70 ? "text-green-600" : qualityScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                {qualityScore}
              </div>
              <div className="text-xs text-gray-500">Quality</div>
            </div>

            {/* Risk */}
            <div className="text-center">
              <div className={`text-xl ${riskPassed ? "text-green-600" : "text-red-600"}`}>
                {riskPassed ? "✓" : "⚠"}
              </div>
              <div className="text-xs text-gray-500">Risk</div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {asset.status === "LOW_SCORE" && (
                <Button size="sm" variant="outline">
                  Regenerate
                </Button>
              )}
              {asset.status === "APPROVED" && (
                <Button size="sm" variant="outline">
                  Schedule
                </Button>
              )}
              <Link href={`/assets/${asset.id}`}>
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
