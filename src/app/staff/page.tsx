"use client";

import { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import { useLanguage } from "../../../LanguageContext";
import Link from "next/link";

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
    <div className="min-h-screen bg-gray-100">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setLanguage("en")}
          className={`px-3 py-1 rounded ${
            language === "en" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage("fi")}
          className={`px-3 py-1 rounded ${
            language === "fi" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          FI
        </button>
        <button
          onClick={() => setLanguage("sv")}
          className={`px-3 py-1 rounded ${
            language === "sv" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          SV
        </button>
      </div>

      {/* Navigation */}
      <div className="absolute top-4 left-4">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Customer View
        </Link>
      </div>

      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-12">
          👨‍💼 {t.staffDashboard}
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 text-sm">{t.nowServing}</p>
            <p className="text-5xl font-bold text-green-600">
              {currentNumber || "-"}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 text-sm">{t.currentQueue}</p>
            <p className="text-5xl font-bold text-blue-600">{queueLength}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 text-sm">{t.served}</p>
            <p className="text-5xl font-bold text-purple-600">{totalServed}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 text-sm">{t.averageWait}</p>
            <p className="text-5xl font-bold text-orange-600">{avgWaitTime}</p>
            <p className="text-sm text-gray-600">{t.minutes}</p>
          </div>
        </div>

        {/* Next in Queue */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">{t.nextInQueue}</h2>
          <div className="flex gap-4">
            {nextInQueue.length > 0 ? (
              nextInQueue.map((num, index) => (
                <div key={index} className="bg-gray-100 rounded-lg px-6 py-3">
                  <span className="text-2xl font-bold">{num}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">{t.queueEmpty}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={callNext}
            disabled={loading || queueLength === 0}
            className="px-12 py-6 bg-gradient-to-r from-green-600 to-green-700 text-white text-2xl font-bold rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {loading ? t.loading : t.callNext}
          </button>

          <button
            onClick={clearQueue}
            className="px-8 py-6 bg-red-600 text-white text-xl font-bold rounded-xl hover:bg-red-700"
          >
            Clear Queue
          </button>
        </div>
      </div>
    </div>
  );
}
