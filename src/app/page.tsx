"use client";

import { useState, useEffect, useMemo } from "react";
import io, { type Socket } from "socket.io-client";
import { useLanguage } from "../../LanguageContext";
import Link from "next/link";
import { Clock, Users, Hash, TrendingUp } from "lucide-react";
import type { Language } from "../../LanguageContext";

let socket: Socket;

export default function CustomerQueue() {
  const { t, language, setLanguage } = useLanguage();

  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [position, setPosition] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    currentServing: 0,
    queueLength: 0,
  });

  // Performance tracking
  const [renderCount, setRenderCount] = useState(0);
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    const start = performance.now();
    socketInitializer();
    setRenderTime(performance.now() - start);
    setRenderCount((prev) => prev + 1);

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const socketInitializer = async () => {
    socket = io("http://localhost:3001");

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("initial-stats", (data) => {
      setStats(data);
    });

    socket.on("customer-called", (data) => {
      setStats((prevStats) => ({
        ...prevStats,
        currentServing: data.number,
      }));

      if (queueNumber && data.number < queueNumber) {
        setPosition((prev) => Math.max(0, prev - 1));
      }
    });

    socket.on("queue-joined", (data) => {
      setStats((prevStats) => ({
        ...prevStats,
        queueLength: data.queueLength,
      }));
    });
  };

  const waitTimeDisplay = useMemo(() => {
    const minutes = position * 3.5;
    return minutes.toFixed(1);
  }, [position]);

  const takeNumber = async () => {
    setLoading(true);
    const startTime = performance.now();

    try {
      const response = await fetch("http://localhost:3001/api/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        setQueueNumber(data.number);
        setPosition(data.position);
        setEstimatedWait(data.estimatedWait);
        console.log(`Response time: ${data.responseTime}ms`);
      }
    } catch (error) {
      console.error("Error joining queue:", error);
    } finally {
      setLoading(false);
      setRenderTime(performance.now() - startTime);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-slate-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation Links */}
            <nav className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Hash className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg">Queue System</span>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/staff"
                  className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
                >
                  {t.staffDashboard}
                </Link>
                <Link
                  href="/display"
                  className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
                >
                  {t.display}
                </Link>
                <Link
                  href="/performance"
                  className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
                >
                  {t.performance}
                </Link>
              </div>
            </nav>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  language === "en"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("fi")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  language === "fi"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                FI
              </button>
              <button
                onClick={() => setLanguage("sv")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  language === "sv"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                SV
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800">
              {t.title}
            </h1>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Join the queue and get real-time updates on your position and
            estimated wait time
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium">
                    {t.nowServing}
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.currentServing || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm font-medium">
                    {t.currentQueue}
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.queueLength}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto">
          {!queueNumber ? (
            <div className="text-center">
              <button
                onClick={takeNumber}
                disabled={loading}
                className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xl font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.loading}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Hash className="w-6 h-6" />
                    {t.takeNumber}
                  </div>
                )}
              </button>
              <p className="text-slate-500 text-sm mt-4">
                Click to join the queue and receive your number
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200/50 p-8 text-center">
              <div className="mb-6">
                <p className="text-slate-600 text-sm font-medium mb-2">
                  {t.yourNumber}
                </p>
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
                  <span className="text-4xl font-bold text-white">
                    {queueNumber}
                  </span>
                </div>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <p className="text-slate-600 text-sm font-medium">
                      {t.position}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {position}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <p className="text-slate-600 text-sm font-medium">
                      {t.estimatedWait}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {waitTimeDisplay} {t.minutes}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-blue-800 text-sm font-medium">
                  You'll be notified when it's your turn. Please stay nearby!
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-6 left-6 bg-slate-900/90 backdrop-blur-sm text-white text-xs rounded-xl p-3 shadow-lg border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="font-medium">Performance</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div>Renders: {renderCount}</div>
            <div>Time: {renderTime.toFixed(2)}ms</div>
            <div className="flex items-center gap-1">
              <span>useMemo:</span>
              <span className="text-green-400">✓</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
