import React from "react";
import { Cloud, Folder, Shield, Sparkles, Upload, Search, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_35%),linear-gradient(135deg,_#0f172a,_#111827)] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gray-900/70 p-6 shadow-2xl shadow-amber-500/10 backdrop-blur md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                  Store, organize, and access everything from one beautiful drive.
                </h1>
                <p className="max-w-2xl text-base text-gray-300 sm:text-lg">
                  Keeply helps you organize files with folders, upload and preview documents.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/workspace"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 font-semibold text-gray-900 transition hover:scale-[1.02]"
                >
                  Open your drive
                </Link>
                <Link
                  to="/signIn"
                  className="inline-flex items-center justify-center rounded-full border border-gray-700 px-6 py-3 font-semibold text-gray-100 transition hover:border-amber-500/50 hover:text-amber-300"
                >
                  Sign in
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gray-800/80 p-5">
              <div className="rounded-2xl border border-gray-700 bg-gray-900/80 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">Everything in one place</p>
                  </div>
                  <div className="rounded-full bg-amber-500/15 p-2 text-amber-400">
                    <Cloud size={18} />
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Projects", detail: "12 files" },
                    { label: "Shared with me", detail: "4 folders" },
                    { label: "Recent uploads", detail: "Updated 3m ago" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-950/70 px-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.detail}</p>
                      </div>
                      <div className="text-amber-400">
                        <Folder size={18} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <FeatureCard icon={<Upload size={28} />} title="Fast uploads" description="Drop files in, organize them instantly, and keep everything accessible." />
          <FeatureCard icon={<Folder size={28} />} title="Folder-based structure" description="Create nested folders and browse your drive like you would in Google Drive." />
          <FeatureCard icon={<Shield size={28} />} title="Secure + offline-safe" description="Your workspace is saved locally in the browser, so your files remain available even when the backend is unavailable." />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-amber-500/15 to-transparent p-6 shadow-lg shadow-amber-500/10">
            <div className="mb-4 flex items-center gap-3 text-amber-400">
              <Smartphone size={20} />
              <h2 className="text-xl font-semibold">Always ready</h2>
            </div>
            <p className="text-gray-300">
              Whether you're working from a laptop or a phone, your files remain easy to find, preview, rename, and move around with a polished drive-style experience.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gray-900/70 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-amber-500/40">
      <div className="mb-3 text-amber-400">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
