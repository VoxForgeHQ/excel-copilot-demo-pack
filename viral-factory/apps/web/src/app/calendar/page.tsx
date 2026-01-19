"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalendarEvent {
  type: "scheduled" | "published";
  date: string;
  platform: string;
  assetType: string;
  assetId: string;
  status?: string;
  postId?: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const startDate = new Date(currentDate);
    startDate.setDate(1);
    const endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    fetch(`/api/analytics/calendar?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentDate]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const platformEmoji: Record<string, string> = {
    PINTEREST: "📌",
    INSTAGRAM: "📸",
    TIKTOK: "🎵",
    YOUTUBE: "▶️",
    LINKEDIN: "💼",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl">🚀</Link>
            <h1 className="text-xl font-bold">Content Calendar</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/vault" className="text-gray-600 hover:text-purple-700">Vault</Link>
            <Link href="/batches" className="text-gray-600 hover:text-purple-700">Batches</Link>
            <Link href="/assets" className="text-gray-600 hover:text-purple-700">Assets</Link>
            <Link href="/calendar" className="text-purple-600 font-medium">Calendar</Link>
            <Link href="/analytics" className="text-gray-600 hover:text-purple-700">Analytics</Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <button 
                onClick={prevMonth}
                className="px-4 py-2 hover:bg-gray-100 rounded"
              >
                ← Previous
              </button>
              <CardTitle>{monthName}</CardTitle>
              <button 
                onClick={nextMonth}
                className="px-4 py-2 hover:bg-gray-100 rounded"
              >
                Next →
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading calendar...</div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before the first of the month */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-24 bg-gray-50 rounded" />
                  ))}

                  {/* Days of the month */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayEvents = getEventsForDay(day);
                    const isToday =
                      day === new Date().getDate() &&
                      currentDate.getMonth() === new Date().getMonth() &&
                      currentDate.getFullYear() === new Date().getFullYear();

                    return (
                      <div
                        key={day}
                        className={`min-h-24 p-2 rounded border ${
                          isToday ? "border-purple-500 bg-purple-50" : "border-gray-100 bg-white"
                        }`}
                      >
                        <div className={`text-sm font-medium mb-1 ${isToday ? "text-purple-600" : ""}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <div
                              key={idx}
                              className={`text-xs px-1 py-0.5 rounded truncate ${
                                event.type === "published"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {platformEmoji[event.platform] ?? "📱"} {event.assetType}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex gap-6 mt-6 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-100 rounded" />
                    <span className="text-sm text-gray-600">Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded" />
                    <span className="text-sm text-gray-600">Published</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
