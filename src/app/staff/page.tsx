"use client";

import { useState, useEffect } from "react";
import io, { type Socket } from "socket.io-client";
import { useLanguage } from "../../../LanguageContext";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle,
  Timer,
  Phone,
  Trash2,
} from "lucide-react";

let socket: Socket;

export default function StaffDashboard() {
  const { t, language, setLanguage } = useLanguage();

  const [currentNumber, setCurrentNumber] = useState(0);
  const [queueLength, setQueueLength] = useState(0);
  const [totalServed, setTotalServed] = useState(0);
  const [nextInQueue, setNextInQueue] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [avgWaitTime, setAvgWaitTime] = useState("3.5");

  useEffect(() => {
    socketInitializer();
    fetchStatus();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const socketInitializer = async () => {
    socket = io("http://localhost:3001");

    socket.on("initial-stats", (data) => {
      setCurrentNumber(data.currentServing);
      setQueueLength(data.queueLength);
      setNextInQueue(data.nextInQueue || []);
      setTotalServed(data.totalServedToday);
      setAvgWaitTime(data.averageWaitTime || "3.5");
    });

    socket.on("customer-called", (data) => {
      setCurrentNumber(data.number);
      if (data.stats) {
        setQueueLength(data.stats.queueLength);
        setNextInQueue(data.stats.nextInQueue || []);
        setTotalServed(data.stats.totalServedToday);
        setAvgWaitTime(data.stats.averageWaitTime || "3.5");
      }
    });

    socket.on("queue-joined", (data) => {
      setQueueLength(data.queueLength);
    });
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/queue/status");
      const data = await response.json();
      setCurrentNumber(data.currentServing);
      setQueueLength(data.queueLength);
      setNextInQueue(data.nextInQueue || []);
      setTotalServed(data.totalServedToday);
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  const callNext = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/queue/next", {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setCurrentNumber(data.number);
        console.log("Called customer:", data.number);
      } else {
        alert(t.queueEmpty);
      }
    } catch (error) {
      console.error("Error calling next:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearQueue = async () => {
    if (confirm("Clear entire queue?")) {
      await fetch("http://localhost:3001/api/queue/clear", { method: "POST" });
      fetchStatus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Language Selector */}
      <div className="absolute top-6 right-6 flex gap-2 z-10">
        <button
          onClick={() => setLanguage("en")}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            language === "en"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
              : "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white border border-slate-200"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage("fi")}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            language === "fi"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
              : "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white border border-slate-200"
          }`}
        >
          FI
        </button>
        <button
          onClick={() => setLanguage("sv")}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            language === "sv"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
              : "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white border border-slate-200"
          }`}
        >
          SV
        </button>
      </div>

      {/* Navigation */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-slate-700 rounded-lg border border-slate-200 hover:bg-white hover:shadow-md transition-all duration-200 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer View
        </Link>
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/25">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            {t.staffDashboard}
          </h1>
          <p className="text-slate-600 text-lg">
            Manage your customer queue efficiently
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm font-medium">
                  {t.nowServing}
                </p>
                <p className="text-4xl font-bold text-green-600">
                  {currentNumber || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm font-medium">
                  {t.currentQueue}
                </p>
                <p className="text-4xl font-bold text-blue-600">
                  {queueLength}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm font-medium">{t.served}</p>
                <p className="text-4xl font-bold text-purple-600">
                  {totalServed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl">
                <Timer className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm font-medium">
                  {t.averageWait}
                </p>
                <p className="text-4xl font-bold text-orange-600">
                  {avgWaitTime}
                </p>
                <p className="text-sm text-slate-500 font-medium">
                  {t.minutes}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Next in Queue */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-xl">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              {t.nextInQueue}
            </h2>
          </div>
          <div className="flex gap-4 flex-wrap">
            {nextInQueue.length > 0 ? (
              nextInQueue.map((num, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <span className="text-2xl font-bold text-slate-700">
                    {num}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center w-full py-8">
                <p className="text-slate-500 text-lg">{t.queueEmpty}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-6 justify-center flex-wrap">
          <button
            onClick={callNext}
            disabled={loading || queueLength === 0}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white text-xl font-bold rounded-2xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg shadow-green-600/25 disabled:hover:scale-100"
          >
            <Phone className="w-6 h-6" />
            {loading ? t.loading : t.callNext}
          </button>

          <button
            onClick={clearQueue}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white text-lg font-bold rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:scale-105 shadow-lg shadow-red-600/25"
          >
            <Trash2 className="w-5 h-5" />
            Clear Queue
          </button>
        </div>
      </div>
    </div>
  );
}
