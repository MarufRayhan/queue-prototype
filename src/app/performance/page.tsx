"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "../../../LanguageContext";

// Simulated queue data
const generateCustomers = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    waitTime: Math.random() * 30,
    serviceType: ["Purchase", "Return", "Support"][
      Math.floor(Math.random() * 3)
    ],
  }));
};

export default function PerformanceComparison() {
  const { t, language, setLanguage } = useLanguage();
  const [customerCount, setCustomerCount] = useState(100);
  const [customers, setCustomers] = useState(() => generateCustomers(100));
  const [testRunning, setTestRunning] = useState(false);
  const [results, setResults] = useState({ withMemo: 0, withoutMemo: 0 });

  // Component WITHOUT useMemo (SLOW)
  const SlowComponent = () => {
    const renderStart = useRef(performance.now());

    // ❌ BAD: This recalculates EVERY time component renders
    const processedData = customers.map((customer) => {
      // Simulate heavy calculation
      let sum = 0;
      for (let i = 0; i < 10000; i++) {
        sum += customer.waitTime * Math.random();
      }
      return {
        ...customer,
        estimatedTime: sum / 10000,
        priority: customer.waitTime > 20 ? "High" : "Normal",
      };
    });

    const avgWait =
      processedData.reduce((acc, c) => acc + c.waitTime, 0) /
      processedData.length;

    return (
      <div className="p-6 bg-red-50 rounded-lg border-2 border-red-500">
        <h3 className="text-xl font-bold text-red-700 mb-4">
          ❌ WITHOUT useMemo (Slow)
        </h3>
        <div className="space-y-2 text-gray-700">
          <p>Processing {customers.length} customers</p>
          <p>Average Wait: {avgWait.toFixed(2)} minutes</p>
          <div className="mt-4 p-3 bg-red-100 rounded">
            <p className="font-mono text-sm">
              Recalculates everything on EVERY render!
            </p>
            <p className="font-mono text-sm text-red-600">
              Performance: POOR ❌
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Component WITH useMemo (FAST)
  const FastComponent = () => {
    const renderStart = useRef(performance.now());

    // ✅ GOOD: This only recalculates when 'customers' changes
    const processedData = useMemo(() => {
      // Same heavy calculation
      return customers.map((customer) => {
        let sum = 0;
        for (let i = 0; i < 10000; i++) {
          sum += customer.waitTime * Math.random();
        }
        return {
          ...customer,
          estimatedTime: sum / 10000,
          priority: customer.waitTime > 20 ? "High" : "Normal",
        };
      });
    }, [customers]); // Only recalculate when customers array changes!

    const avgWait = useMemo(() => {
      return (
        processedData.reduce((acc, c) => acc + c.waitTime, 0) /
        processedData.length
      );
    }, [processedData]);

    return (
      <div className="p-6 bg-green-50 rounded-lg border-2 border-green-500">
        <h3 className="text-xl font-bold text-green-700 mb-4">
          ✅ WITH useMemo (Fast)
        </h3>
        <div className="space-y-2 text-gray-700">
          <p>Processing {customers.length} customers</p>
          <p>Average Wait: {avgWait.toFixed(2)} minutes</p>
          <div className="mt-4 p-3 bg-green-100 rounded">
            <p className="font-mono text-sm">Caches calculation results!</p>
            <p className="font-mono text-sm text-green-600">
              Performance: EXCELLENT ✅
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Run performance test
  const runPerformanceTest = () => {
    setTestRunning(true);

    // Test WITHOUT useMemo
    const slowStart = performance.now();
    for (let i = 0; i < 10; i++) {
      // Simulate re-renders
      const data = customers.map((c) => ({
        ...c,
        calculated: c.waitTime * Math.random() * 1000,
      }));
    }
    const slowTime = performance.now() - slowStart;

    // Test WITH useMemo (simulated by caching)
    const fastStart = performance.now();
    const cached = customers.map((c) => ({
      ...c,
      calculated: c.waitTime * Math.random() * 1000,
    }));
    for (let i = 0; i < 10; i++) {
      // Use cached result instead of recalculating
      const data = cached;
    }
    const fastTime = performance.now() - fastStart;

    setResults({
      withMemo: fastTime,
      withoutMemo: slowTime,
    });

    setTimeout(() => setTestRunning(false), 1000);
  };

  const improvement =
    results.withoutMemo > 0
      ? Math.round((1 - results.withMemo / results.withoutMemo) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
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
          ← Back to Queue System
        </Link>
      </div>

      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-center mb-4">
          📊 React Performance: useMemo Demo
        </h1>
        <p className="text-center text-gray-600 mb-8">
          See how useMemo optimizes queue calculations for for any Queue
          management system
        </p>

        {/* Explanation Box */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-3">What is useMemo?</h2>
          <p className="mb-2">
            <strong>useMemo</strong> is a React Hook that memorizes expensive
            calculations.
          </p>
          <p className="mb-2">
            <strong>Problem:</strong> Without useMemo, React recalculates
            everything on every render (slow for 500+ stores!)
          </p>
          <p>
            <strong>Solution:</strong> useMemo caches results and only
            recalculates when dependencies change.
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex gap-4 items-center justify-center flex-wrap">
            <div className="flex gap-2 items-center">
              <span className="font-semibold">Queue Size:</span>
              <button
                onClick={() => {
                  setCustomerCount(100);
                  setCustomers(generateCustomers(100));
                }}
                className={`px-4 py-2 rounded ${
                  customerCount === 100
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                100 customers
              </button>
              <button
                onClick={() => {
                  setCustomerCount(500);
                  setCustomers(generateCustomers(500));
                }}
                className={`px-4 py-2 rounded ${
                  customerCount === 500
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                500 customers
              </button>
              <button
                onClick={() => {
                  setCustomerCount(1000);
                  setCustomers(generateCustomers(1000));
                }}
                className={`px-4 py-2 rounded ${
                  customerCount === 1000
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                1000 customers
              </button>
            </div>

            <button
              onClick={runPerformanceTest}
              disabled={testRunning}
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {testRunning ? "Testing..." : "Run Performance Test"}
            </button>
          </div>
        </div>

        {/* Visual Comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <SlowComponent />
          <FastComponent />
        </div>

        {/* Results */}
        {results.withoutMemo > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Test Results
            </h2>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-red-50 rounded">
                <p className="text-sm text-gray-600">Without useMemo</p>
                <p className="text-3xl font-bold text-red-600">
                  {results.withoutMemo.toFixed(2)}ms
                </p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded">
                <p className="text-sm text-gray-600">With useMemo</p>
                <p className="text-3xl font-bold text-green-600">
                  {results.withMemo.toFixed(2)}ms
                </p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded">
                <p className="text-sm text-gray-600">Improvement</p>
                <p className="text-3xl font-bold text-purple-600">
                  {improvement}% Faster!
                </p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <h3 className="font-bold mb-2">💡 Why This Matters for EWQ:</h3>
              <ul className="space-y-1 text-sm">
                <li>
                  • With 500+ stores, each saving 50ms = 25 seconds saved!
                </li>
                <li>• Real-time queue updates won't lag</li>
                <li>• Digital displays refresh smoothly</li>
                <li>• Lower server costs from reduced calculations</li>
              </ul>
            </div>
          </div>
        )}

        {/* Code Example */}
        <div className="bg-gray-900 text-white rounded-lg p-6 mt-8">
          <h3 className="text-xl font-bold mb-4">
            Code Example for Queue System:
          </h3>
          <pre className="text-sm overflow-x-auto">
            <code>{`// ❌ BAD - Recalculates every render
function QueueDisplay({ customers }) {
  const waitTimes = customers.map(c => 
    calculateComplexWaitTime(c)  // Expensive!
  );
  return <div>{waitTimes}</div>;
}

// ✅ GOOD - Only recalculates when customers change
function QueueDisplay({ customers }) {
  const waitTimes = useMemo(() => 
    customers.map(c => calculateComplexWaitTime(c)),
    [customers]  // Dependency array
  );
  return <div>{waitTimes}</div>;
}`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
