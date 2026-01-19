import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <h1 className="text-xl font-bold text-purple-900">VOXFORGE Viral Factory</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/vault" className="text-gray-600 hover:text-purple-700">Vault</Link>
            <Link href="/batches" className="text-gray-600 hover:text-purple-700">Batches</Link>
            <Link href="/assets" className="text-gray-600 hover:text-purple-700">Assets</Link>
            <Link href="/calendar" className="text-gray-600 hover:text-purple-700">Calendar</Link>
            <Link href="/analytics" className="text-gray-600 hover:text-purple-700">Analytics</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Generate Viral Content at Scale
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Turn your Notion knowledge vault into platform-native content for Pinterest, Instagram, TikTok, YouTube, and LinkedIn.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/batches/new" 
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Create New Batch
            </Link>
            <Link 
              href="/vault" 
              className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold border border-purple-200 hover:bg-purple-50 transition"
            >
              Sync Vault
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <FeatureCard 
            emoji="🧠"
            title="Notion RAG"
            description="Connect your Notion knowledge vault. We extract, embed, and retrieve relevant context for every piece of content."
          />
          <FeatureCard 
            emoji="🎯"
            title="Viral Formulas"
            description="Proven hook formulas, retention scripts, and persuasion frameworks baked into every generation."
          />
          <FeatureCard 
            emoji="📊"
            title="Quality Scoring"
            description="Every asset gets a scorecard. Low scores auto-regenerate until they pass the quality threshold."
          />
          <FeatureCard 
            emoji="🔒"
            title="Risk Gate"
            description="Automatic detection of risky claims. Claims without sources degrade to experience-based language."
          />
          <FeatureCard 
            emoji="🧪"
            title="A/B Variants"
            description="Generate hook A vs B, soft vs hard CTAs, and thumbnail variants. Track winners automatically."
          />
          <FeatureCard 
            emoji="📅"
            title="Smart Scheduling"
            description="Calendar view, quiet hours, and timezone-aware scheduling. Auto-publish when risk gate passes."
          />
        </div>

        {/* Platforms */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-8">Platform-Native Content</h3>
          <div className="flex justify-center gap-12">
            <PlatformBadge name="Pinterest" emoji="📌" />
            <PlatformBadge name="Instagram" emoji="📸" />
            <PlatformBadge name="TikTok" emoji="🎵" />
            <PlatformBadge name="YouTube" emoji="▶️" />
            <PlatformBadge name="LinkedIn" emoji="💼" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-20 bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Quick Stats</h3>
          <div className="grid grid-cols-4 gap-8">
            <StatCard label="Vault Sources" value="—" />
            <StatCard label="Content Batches" value="—" />
            <StatCard label="Assets Generated" value="—" />
            <StatCard label="Published Posts" value="—" />
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Connect your Notion vault and start generating content to see live stats.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-500">
          <p>VOXFORGE Viral Post Factory • Built with safety and quality in mind</p>
          <p className="text-sm mt-2">We optimize for virality probability, not promises.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
      <div className="text-3xl mb-4">{emoji}</div>
      <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PlatformBadge({ name, emoji }: { name: string; emoji: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-4xl">{emoji}</span>
      <span className="text-sm font-medium text-gray-700">{name}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-purple-600">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
