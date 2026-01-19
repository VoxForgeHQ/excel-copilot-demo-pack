"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface VaultStatus {
  status: string;
  lastSyncAt: string | null;
  lastError: string | null;
  sourcesCount: number;
  chunksCount: number;
}

interface VaultSource {
  id: string;
  pageId: string;
  title: string;
  url: string;
  lastSyncedAt: string;
  metadata: Record<string, unknown>;
  _count: { chunks: number };
}

export default function VaultPage() {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [sources, setSources] = useState<VaultSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statusRes, sourcesRes] = await Promise.all([
        fetch("/api/vault/status"),
        fetch("/api/vault/sources"),
      ]);
      
      if (statusRes.ok) {
        setStatus(await statusRes.json());
      }
      if (sourcesRes.ok) {
        const data = await sourcesRes.json();
        setSources(data.sources);
      }
    } catch (err) {
      setError("Failed to load vault data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/vault/sync", { method: "POST" });
      if (res.ok) {
        // Poll for status updates
        const interval = setInterval(async () => {
          const statusRes = await fetch("/api/vault/status");
          if (statusRes.ok) {
            const newStatus = await statusRes.json();
            setStatus(newStatus);
            if (newStatus.status !== "syncing") {
              clearInterval(interval);
              setSyncing(false);
              fetchData();
            }
          }
        }, 2000);
      } else {
        setError("Failed to start sync");
        setSyncing(false);
      }
    } catch {
      setError("Failed to start sync");
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading vault...</div>
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
            <h1 className="text-xl font-bold">Knowledge Vault</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/vault" className="text-purple-600 font-medium">Vault</Link>
            <Link href="/batches" className="text-gray-600 hover:text-purple-700">Batches</Link>
            <Link href="/assets" className="text-gray-600 hover:text-purple-700">Assets</Link>
            <Link href="/calendar" className="text-gray-600 hover:text-purple-700">Calendar</Link>
            <Link href="/analytics" className="text-gray-600 hover:text-purple-700">Analytics</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vault Status</CardTitle>
                <CardDescription>
                  Connected to your Notion knowledge base
                </CardDescription>
              </div>
              <Button onClick={handleSync} disabled={syncing}>
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              <StatusItem 
                label="Status" 
                value={status?.status ?? "Unknown"}
                color={status?.status === "success" ? "green" : status?.status === "syncing" ? "yellow" : "gray"}
              />
              <StatusItem 
                label="Sources" 
                value={String(status?.sourcesCount ?? 0)}
              />
              <StatusItem 
                label="Chunks" 
                value={String(status?.chunksCount ?? 0)}
              />
              <StatusItem 
                label="Last Sync" 
                value={status?.lastSyncAt 
                  ? new Date(status.lastSyncAt).toLocaleString() 
                  : "Never"}
              />
            </div>
            {status?.lastError && (
              <div className="mt-4 p-3 bg-red-50 rounded text-red-700 text-sm">
                Last error: {status.lastError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sources List */}
        <Card>
          <CardHeader>
            <CardTitle>Synced Sources</CardTitle>
            <CardDescription>
              Pages from your Notion database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No sources synced yet.</p>
                <p className="text-sm">Click "Sync Now" to pull content from your Notion vault.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sources.map((source) => (
                  <div 
                    key={source.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-purple-600 hover:underline"
                      >
                        {source.title}
                      </a>
                      <div className="text-sm text-gray-500 mt-1">
                        {source._count.chunks} chunks • 
                        Last synced: {new Date(source.lastSyncedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {Object.entries(source.metadata).slice(0, 3).map(([key, value]) => (
                        <span 
                          key={key}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                        >
                          {String(value)}
                        </span>
                      ))}
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

function StatusItem({ 
  label, 
  value, 
  color = "gray" 
}: { 
  label: string; 
  value: string; 
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
    gray: "text-gray-900",
  };

  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-xl font-semibold ${colorClasses[color] ?? colorClasses.gray}`}>
        {value}
      </div>
    </div>
  );
}
