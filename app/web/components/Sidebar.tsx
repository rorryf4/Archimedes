'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LAST_VIEWED_KEY = 'alerts-last-viewed';

export default function Sidebar() {
  const navItems = ['Signals', 'Settings'];
  const pathname = usePathname();
  const [newEventsCount, setNewEventsCount] = useState(0);

  // Poll for triggered alerts every 10 seconds
  useEffect(() => {
    const fetchEventCount = async () => {
      try {
        const response = await fetch('/api/triggered-alerts?limit=100');
        if (response.ok) {
          const events = await response.json();

          // Calculate new events (events after last viewed timestamp)
          const lastViewed = localStorage.getItem(LAST_VIEWED_KEY);
          if (lastViewed) {
            const lastViewedTime = new Date(lastViewed).getTime();
            const newEvents = events.filter(
              (event: { triggeredAt: string }) =>
                new Date(event.triggeredAt).getTime() > lastViewedTime
            );
            setNewEventsCount(newEvents.length);
          } else {
            setNewEventsCount(events.length);
          }
        }
      } catch (error) {
        console.error('Error fetching triggered alerts:', error);
      }
    };

    // Fetch immediately
    fetchEventCount();

    // Then poll every 10 seconds
    const intervalId = setInterval(fetchEventCount, 10_000);

    return () => clearInterval(intervalId);
  }, []);

  // When user visits /alerts page, mark all events as viewed
  useEffect(() => {
    if (pathname === '/alerts') {
      const timestamp = new Date().toISOString();
      localStorage.setItem(LAST_VIEWED_KEY, timestamp);
      // The next poll cycle will naturally recalculate newEventsCount to 0
      // based on the updated localStorage timestamp, avoiding direct setState
    }
  }, [pathname]);

  return (
    <nav aria-label="Primary navigation" className="w-60 bg-slate-950 py-4 px-2">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 py-2 mb-2">
        Navigation
      </div>
      <ul className="space-y-1">
        <li>
          <Link
            href="/"
            className="block w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            href="/markets"
            className="block w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Markets
          </Link>
        </li>
        <li>
          <Link
            href="/tokens"
            className="block w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Tokens
          </Link>
        </li>
        <li>
          <Link
            href="/watchlists"
            className="block w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Watchlists
          </Link>
        </li>
        <li>
          <Link
            href="/opportunities"
            className="block w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Opportunities
          </Link>
        </li>
        <li>
          <Link
            href="/alerts"
            className="block w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950 flex items-center gap-2"
          >
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                />
              </svg>
              {newEventsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {newEventsCount > 9 ? '9+' : newEventsCount}
                </span>
              )}
            </div>
            Alerts
          </Link>
        </li>
        {navItems.map((item) => (
          <li key={item}>
            <button className="w-full text-left text-sm px-3 py-2 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950">
              {item}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
