"use client";

import { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import { useLanguage } from "../../../LanguageContext";
import Link from "next/link";

let socket: Socket;

export default function DisplayBoard() {
  const { t } = useLanguage();

  const [currentNumber, setCurrentNumber] = useState(0);
  const [nextInQueue, setNextInQueue] = useState<number[]>([]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    socketInitializer();
    fetchStatus();

    // Update time every second
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      if (socket) socket.disconnect();
      clearInterval(timer);
    };
  }, []);

  const socketInitializer = async () => {
    socket = io("http://localhost:3001");

    socket.on("initial-stats", (data) => {
      setCurrentNumber(data.currentServing);
      setNextInQueue(data.nextInQueue || []);
    });

    socket.on("customer-called", (data) => {
      setCurrentNumber(data.number);
      if (data.stats) {
        setNextInQueue(data.stats.nextInQueue || []);
      }

      // Flash animation when new number called
      const element = document.getElementById("current-number");
      if (element) {
        element.classList.add("animate-pulse");
        setTimeout(() => {
          element.classList.remove("animate-pulse");
        }, 2000);
      }
    });

    socket.on("queue-joined", (data) => {
      fetchStatus();
    });
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/queue/status");
      const data = await response.json();
      setCurrentNumber(data.currentServing);
      setNextInQueue(data.nextInQueue || []);
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 text-white p-8">
      {/* Back Link */}
      <div className="absolute top-4 left-4">
        <Link href="/" className="text-white/80 hover:text-white">
          ← Back
        </Link>
      </div>

      {/* Time Display */}
      <div className="text-center mb-8">
        <div className="text-3xl font-light">
          {time.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
        <div className="text-5xl font-bold">
          {time.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </div>

      {/* Now Serving */}
      <div className="text-center mb-12">
        <h1 className="text-4xl mb-4">{t.nowServing}</h1>
        <div
          id="current-number"
          className="text-[12rem] font-bold leading-none transition-all duration-500"
        >
          {currentNumber || "-"}
        </div>
        <p className="text-3xl mt-4">{t.counter} 1</p>
      </div>

      {/* Next in Queue */}
      <div className="bg-white/10 rounded-2xl p-8 backdrop-blur">
        <h2 className="text-2xl mb-6">{t.nextInQueue}</h2>
        <div className="grid grid-cols-5 gap-4">
          {nextInQueue.length > 0 ? (
            nextInQueue.map((num, index) => (
              <div
                key={index}
                className="bg-white/20 rounded-xl p-6 text-center backdrop-blur"
              >
                <span className="text-4xl font-bold">{num}</span>
              </div>
            ))
          ) : (
            <div className="col-span-5 text-center text-2xl text-white/60">
              {t.queueEmpty}
            </div>
          )}
        </div>
      </div>

      {/* Company Branding */}
      <div className="absolute bottom-8 right-8 text-right">
        <p className="text-xl opacity-80">Nordic Queue System</p>
        <p className="text-sm opacity-60">Powered by Prototype of Maruf</p>
      </div>
    </div>
  );
}
