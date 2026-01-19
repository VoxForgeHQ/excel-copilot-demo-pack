"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WeeklySummary {
  period: { start: string; end: string };
  summary: {
    totalPosts: number;
    totalImpressions: number;
    totalEngagement: number;
    totalSaves: number;
    totalClicks: number;
    engagementRate: string;
    batchesCreated: number;
    assetsGenerated: number;
  };
  platformBreakdown: Record<string, { posts: number; impressions: number; engagement: number }>;
}

interface WinningPattern {
  id: string;
  platform: string;
  patternType: string;
  details: { patterns?: string[]; confidence?: number };
  confidence: number;
  sampleSize: number;
}

export default function AnalyticsPage() {
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null);
  const [patterns, setPatterns] = useState<WinningPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/weekly").then((r) => r.json()),
      fetch("/api/analytics/patterns").then((r) => r.json()),
    ])
      .then(([weeklyData, patternsData]) => {
        setWeekly(weeklyData);
        setPatterns(patternsData.patterns);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSyncMetrics = async () => {
    await fetch("/api/analytics/metrics/sync", { method: "POST" });
    // Refresh after a delay
    setTimeout(() => {
      fetch("/api/analytics/weekly")
        .then((r) => r.json())
        .then(setWeekly);
    }, 2000);
  };

  const handleMinePatterns = async () => {
    await fetch("/api/analytics/patterns/mine", { method: "POST" });
    // Refresh after a delay
    setTimeout(() => {
      fetch("/api/analytics/patterns")
        .then((r) => r.json())
        .then((data) => setPatterns(data.patterns));
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading analytics...</div>
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
            <h1 className="text-xl font-bold">Analytics</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/vault" className="text-gray-600 hover:text-purple-700">Vault</Link>
            <Link href="/batches" className="text-gray-600 hover:text-purple-700">Batches</Link>
            <Link href="/assets" className="text-gray-600 hover:text-purple-700">Assets</Link>
            <Link href="/calendar" className="text-gray-600 hover:text-purple-700">Calendar</Link>
            <Link href="/analytics" className="text-purple-600 font-medium">Analytics</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Button variant="outline" onClick={handleSyncMetrics}>
            Sync Metrics
          </Button>
          <Button variant="outline" onClick={handleMinePatterns}>
            Mine Patterns
          </Button>
        </div>

        {/* Weekly Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>
              Performance over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <MetricCard 
                label="Total Posts" 
                value={weekly?.summary.totalPosts ?? 0}
              />
              <MetricCard 
                label="Impressions" 
                value={formatNumber(weekly?.summary.totalImpressions ?? 0)}
              />
              <MetricCard 
                label="Engagement" 
                value={formatNumber(weekly?.summary.totalEngagement ?? 0)}
              />
              <MetricCard 
                label="Engagement Rate" 
                value={weekly?.summary.engagementRate ?? "0%"}
              />
              <MetricCard 
                label="Saves" 
                value={formatNumber(weekly?.summary.totalSaves ?? 0)}
              />
              <MetricCard 
                label="Clicks" 
                value={formatNumber(weekly?.summary.totalClicks ?? 0)}
              />
              <MetricCard 
                label="Batches Created" 
                value={weekly?.summary.batchesCreated ?? 0}
              />
              <MetricCard 
                label="Assets Generated" 
                value={weekly?.summary.assetsGenerated ?? 0}
              />
            </div>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {weekly?.platformBreakdown && Object.keys(weekly.platformBreakdown).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(weekly.platformBreakdown).map(([platform, data]) => (
                  <div key={platform} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-2xl mb-2">
                      {getPlatformEmoji(platform)}
                    </div>
                    <div className="font-medium">{platform}</div>
                    <div className="text-sm text-gray-500 mt-2">
                      <div>{data.posts} posts</div>
                      <div>{formatNumber(data.impressions)} impressions</div>
                      <div>{formatNumber(data.engagement)} engagement</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No platform data available. Publish content to see breakdowns.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Winning Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Winning Patterns</CardTitle>
            <CardDescription>
              Patterns identified from top-performing content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {patterns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No patterns discovered yet.</p>
                <p className="text-sm">
                  Click "Mine Patterns" after publishing content to analyze what works.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {patterns.map((pattern) => (
                  <div key={pattern.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{getPlatformEmoji(pattern.platform)}</span>
                      <span className="font-medium">{pattern.platform}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{pattern.patternType}</span>
                      <span className="ml-auto text-sm text-gray-500">
                        {(pattern.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    {pattern.details.patterns && (
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {pattern.details.patterns.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      Based on {pattern.sampleSize} samples
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-purple-600">{value}</div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function getPlatformEmoji(platform: string): string {
  const emojis: Record<string, string> = {
    PINTEREST: "📌",
    INSTAGRAM: "📸",
    TIKTOK: "🎵",
    YOUTUBE: "▶️",
    LINKEDIN: "💼",
  };
  return emojis[platform] ?? "📱";
}
