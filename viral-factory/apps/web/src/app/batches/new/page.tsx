"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Brand {
  id: string;
  name: string;
}

interface Offer {
  id: string;
  name: string;
  brandId: string;
}

interface Topic {
  id: string;
  name: string;
}

const PLATFORMS = [
  { id: "PINTEREST", name: "Pinterest", emoji: "📌" },
  { id: "INSTAGRAM", name: "Instagram", emoji: "📸" },
  { id: "TIKTOK", name: "TikTok", emoji: "🎵" },
  { id: "YOUTUBE", name: "YouTube", emoji: "▶️" },
  { id: "LINKEDIN", name: "LinkedIn", emoji: "💼" },
];

export default function NewBatchPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [brands, setBrands] = useState<Brand[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [offerId, setOfferId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["INSTAGRAM", "LINKEDIN"]);

  // Load initial data
  useEffect(() => {
    // In production, would fetch from API
    // Using demo data for now
    setBrands([{ id: "demo-brand", name: "VOXFORGE Demo Brand" }]);
    setOffers([{ id: "demo-offer", name: "Free Content Strategy Guide", brandId: "demo-brand" }]);
    setTopics([
      { id: "topic-content", name: "Content Creation" },
      { id: "topic-marketing", name: "Digital Marketing" },
      { id: "topic-productivity", name: "Productivity & Systems" },
    ]);
    setBrandId("demo-brand");
    setOfferId("demo-offer");
    setLoading(false);
  }, []);

  const togglePlatform = (platformId: string) => {
    setPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !prompt.trim() || platforms.length === 0) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          brandId,
          offerId,
          topicId: topicId || undefined,
          prompt,
          platforms,
        }),
      });

      if (res.ok) {
        const batch = await res.json();
        router.push(`/batches/${batch.id}`);
      } else {
        const data = await res.json();
        setError(data.message ?? "Failed to create batch");
      }
    } catch {
      setError("Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
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
            <h1 className="text-xl font-bold">Create New Batch</h1>
          </div>
          <Link href="/batches">
            <Button variant="ghost">Cancel</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-24 h-1 ${
                    step > s ? "bg-purple-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Set up your content batch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Batch Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Q1 Social Campaign"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Brand *
                </label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Offer *
                </label>
                <select
                  value={offerId}
                  onChange={(e) => setOfferId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {offers
                    .filter((o) => o.brandId === brandId)
                    .map((offer) => (
                      <option key={offer.id} value={offer.id}>
                        {offer.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Topic (Optional)
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">No specific topic</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>
                  Next: Content Brief
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Content Brief */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Content Brief</CardTitle>
              <CardDescription>
                Describe what content you want to generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  What topic or content do you want to create? *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Example: Create content about the top 5 mistakes people make when starting a content strategy. Focus on practical, actionable tips that busy entrepreneurs can implement today."
                />
                <p className="text-sm text-gray-500 mt-2">
                  Be specific about the angle, audience pain points, and what makes this content valuable.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Next: Platforms
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Platforms */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Target Platforms</CardTitle>
              <CardDescription>
                Select where you want to publish this content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`p-4 rounded-lg border-2 transition ${
                      platforms.includes(platform.id)
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-3xl mb-2">{platform.emoji}</div>
                    <div className="font-medium">{platform.name}</div>
                    {platforms.includes(platform.id) && (
                      <div className="text-sm text-purple-600 mt-1">✓ Selected</div>
                    )}
                  </button>
                ))}
              </div>

              {platforms.length === 0 && (
                <p className="text-red-500 text-sm">
                  Please select at least one platform
                </p>
              )}

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h4 className="font-medium mb-2">Batch Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Name:</strong> {name}</p>
                  <p><strong>Brand:</strong> {brands.find((b) => b.id === brandId)?.name}</p>
                  <p><strong>Offer:</strong> {offers.find((o) => o.id === offerId)?.name}</p>
                  <p><strong>Platforms:</strong> {platforms.join(", ")}</p>
                  <p><strong>Brief:</strong> {prompt.substring(0, 100)}...</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={submitting || platforms.length === 0}>
                  {submitting ? "Creating..." : "Create Batch"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
