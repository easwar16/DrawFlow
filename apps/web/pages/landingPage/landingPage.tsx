import {
  Pencil,
  Users,
  Zap,
  Download,
  Lock,
  Layers,
  ArrowRight,
  Github,
  Sparkles,
  Brush,
  ArrowLeftIcon,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb w-96 h-96 bg-emerald-500 opacity-20 -top-48 -left-48"></div>
        <div className="orb w-96 h-96 bg-pink-500 opacity-20 -bottom-48 -right-48"></div>
      </div>

      <nav className="container mx-auto px-6 py-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 group">
            <div className="relative">
              <Pencil className="w-8 h-8 text-emerald-400 group-hover:text-pink-400 transition-colors duration-300 float" />
            </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-pink-400 bg-clip-text text-transparent">
              DrawFlow
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/auth"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-pink-500 text-[#c7f3e2] px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="container mx-auto px-6 pt-24 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 glass-effect text-emerald-300 px-4 py-2 rounded-full mb-8 group">
              <Sparkles className="w-4 h-4 group-hover:animate-spin" />
              <span className="text-sm font-medium">
                Open Source & Free Forever
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-[#c7f3e2]">Sketch ideas.</span>
              <br />
              <span className="gradient-text">Collaborate instantly.</span>
            </h1>

            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              A powerful, intuitive whiteboard tool for visualizing concepts,
              creating diagrams, and collaborating with your team in real-time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-pink-500 text-[#c7f3e2] px-8 py-4 rounded-full hover:shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 text-lg font-medium">
                <span>Start Drawing</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link
                href="https://github.com/easwar16/DrawFlow"
                className="flex items-center space-x-2 glass-effect text-[#c7f3e2] px-8 py-4 rounded-full hover:bg-[#c7f3e2]/10 transition-all duration-300 hover:scale-105 text-lg font-medium"
              >
                <Github className="w-5 h-5" />
                <span>View on GitHub</span>
              </Link>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-pink-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-75 transition-all duration-300"></div>
              <div className="relative glass-effect rounded-3xl p-8">
                <div className="aspect-video bg-gradient-to-br from-emerald-900/50 to-pink-900/50 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <div className="text-center">
                    <Brush className="w-16 h-16 text-emerald-400 mx-auto mb-4 float" />
                    <p className="text-gray-300">Canvas Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-[#c7f3e2] mb-4">
                Everything you need to create
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Powerful features designed for seamless creativity and
                collaboration
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Pencil,
                  title: "Intuitive Drawing",
                  desc: "Create shapes, arrows, and freehand drawings with an intuitive interface that feels natural.",
                  color: "emerald",
                },
                {
                  icon: Users,
                  title: "Real-time Collaboration",
                  desc: "Work together with your team in real-time. See changes as they happen, no refresh needed.",
                  color: "pink",
                },
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  desc: "Optimized performance ensures smooth drawing even with complex diagrams and multiple users.",
                  color: "amber",
                },
                {
                  icon: Download,
                  title: "Export Anywhere",
                  desc: "Export your creations as PNG, SVG, or JSON. Your work, your format, your choice.",
                  color: "rose",
                },
                {
                  icon: Lock,
                  title: "Privacy First",
                  desc: "Your data stays yours. End-to-end encryption ensures your diagrams remain private.",
                  color: "cyan",
                },
                {
                  icon: Layers,
                  title: "Infinite Canvas",
                  desc: "Never run out of space. Pan, zoom, and create without boundaries on an infinite canvas.",
                  color: "fuchsia",
                },
              ].map((feature, i) => {
                const colorMap = {
                  emerald:
                    "from-emerald-500 to-emerald-600 text-emerald-400 bg-emerald-500/10",
                  pink: "from-pink-500 to-pink-600 text-pink-400 bg-pink-500/10",
                  amber:
                    "from-amber-500 to-amber-600 text-amber-400 bg-amber-500/10",
                  rose: "from-rose-500 to-rose-600 text-rose-400 bg-rose-500/10",
                  cyan: "from-cyan-500 to-cyan-600 text-cyan-400 bg-cyan-500/10",
                  fuchsia:
                    "from-fuchsia-500 to-fuchsia-600 text-fuchsia-400 bg-fuchsia-500/10",
                };
                const Icon = feature.icon;
                const colors = colorMap[feature.color as keyof typeof colorMap];
                return (
                  <div
                    key={i}
                    className="group glass-effect p-8 rounded-2xl hover:bg-[#c7f3e2]/10 transition-all duration-300 hover:translate-y-[-8px]"
                  >
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${colors} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-[#c7f3e2] mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-pink-600/20 blur-3xl"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="glass-effect rounded-3xl p-16 text-center border border-emerald-500/30">
              <h2 className="text-4xl md:text-5xl font-bold text-[#c7f3e2] mb-6">
                Ready to start creating?
              </h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                Join thousands of teams using DrawFlow to bring their ideas to
                life
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-pink-500 text-[#c7f3e2] px-8 py-4 rounded-full hover:shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 text-lg font-medium"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <footer className="bg-gray-950 text-gray-400 py-12 border-t border-gray-800 relative z-10">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0 group">
                <Pencil className="w-6 h-6 text-emerald-400 group-hover:text-pink-400 transition-colors duration-300" />
                <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-pink-400 bg-clip-text text-transparent">
                  DrawFlow
                </span>
              </div>
              <p className="text-sm">
                Made with passion for creators everywhere
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
