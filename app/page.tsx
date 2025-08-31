'use client'
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Sparkles, ChevronRight, CheckCircle2, Leaf, Rocket, Shield, Lightbulb, ArrowLeft, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Mission {
  id: string;
  title: string;
  summary: string;
  ageMin: number;
  ageMax: number;
  icon: "rocket" | "leaf" | "flask";
  materials: string[];
  steps: string[];
  learningPoints: string[];
  safetyNotes?: string;
  hints: string[];
}

interface ProgressRecord {
  missionId: string;
  completedAtISO: string;
}

const MISSIONS: Mission[] = [
  {
    id: "balloon-lab",
    title: "Balloon Lab",
    summary: "Make a balloon inflate using a simple kitchen reaction.",
    ageMin: 6,
    ageMax: 11,
    icon: "flask",
    materials: ["Baking soda (1 tsp)", "Vinegar (2 tbsp)", "Balloon", "Small bottle", "Funnel (optional)"],
    steps: [
      "Carefully put baking soda into the balloon.",
      "Pour vinegar into the empty bottle.",
      "Stretch the balloon over the bottle mouth without spilling.",
      "Lift the balloon so the baking soda falls in. Watch the balloon!",
    ],
    learningPoints: [
      "Acid + base reaction creates a gas (carbon dioxide).",
      "Gas takes up space and can inflate the balloon.",
    ],
    safetyNotes: "Do this on a tray or sink area. Do not taste the materials.",
    hints: [
      "What new substance could be made when vinegar meets baking soda?",
      "Think of a gas that could fill the balloon.",
      "The gas is CO₂. That's what inflates the balloon!",
    ],
  },
  {
    id: "rainbow-milk",
    title: "Rainbow Milk",
    summary: "Create swirling colours on milk using a tiny drop of dish soap.",
    ageMin: 6,
    ageMax: 11,
    icon: "leaf",
    materials: ["Shallow plate", "Milk (enough to cover plate)", "Food colouring (2–3 colours)", "Cotton bud", "Dish soap (a drop)"],
    steps: [
      "Pour milk into the plate (just enough to cover the bottom).",
      "Add tiny drops of different food colouring around the milk.",
      "Dip the cotton bud in dish soap, then gently touch the milk's surface.",
      "Observe the sudden colour bursts and swirls!",
    ],
    learningPoints: [
      "Soap breaks surface tension and moves fats around in milk.",
      "This movement makes the colours swirl.",
    ],
    safetyNotes: "Protect clothes and surfaces from food colouring. Do not drink the milk.",
    hints: [
      "What changes when soap touches water or milk?",
      "Consider surface tension — does soap increase or decrease it?",
      "Soap lowers surface tension and pushes the colours around!",
    ],
  },
  {
    id: "paper-bridge",
    title: "Paper Bridge Challenge",
    summary: "Engineer a strong bridge from just paper and coins!",
    ageMin: 6,
    ageMax: 11,
    icon: "rocket",
    materials: ["A4 paper (3–4 sheets)", "Books or cups (two stacks)", "Coins or small weights"],
    steps: [
      "Set two stacks ~15 cm apart (books or cups).",
      "Bridge the gap with one sheet of paper and test how many coins it holds.",
      "Now fold another sheet into a fan/accordion and test again.",
      "Try different shapes (tubes, I-beam folds). Which is strongest?",
    ],
    learningPoints: [
      "Shapes can make structures stronger without changing material.",
      "Engineers test designs and improve them (iteration).",
    ],
    safetyNotes: "Avoid sharp paper edges; keep coins away from mouths (choking hazard).",
    hints: [
      "How do bridges stay strong? Think of shapes you see underneath them.",
      "Try folding to make beams or tubes.",
      "More rigid shapes (like corrugations/tubes) stop the paper from bending.",
    ],
  },
];

const LS_KEY = "wm_progress_v1";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function loadProgress(): ProgressRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ProgressRecord[];
  } catch {
    return [];
  }
}

function saveProgress(p: ProgressRecord[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(p));
}

function uniqueDates(records: ProgressRecord[]): string[] {
  return Array.from(new Set(records.map((r) => r.completedAtISO))).sort();
}

function calculateCurrentStreak(datesISO: string[]): number {
  if (datesISO.length === 0) return 0;
  const set = new Set(datesISO);
  let streak = 0;
  const d = new Date();
  for (;;) {
    const iso = d.toISOString().slice(0, 10);
    if (set.has(iso)) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function badgeList(totalCompleted: number, streak: number) {
  const out: { id: string; name: string; earned: boolean; icon: React.ReactNode; desc: string }[] = [
    { id: "first", name: "First Mission!", earned: totalCompleted >= 1, icon: <Sparkles className="w-5 h-5" />, desc: "Complete your first mission." },
    { id: "triple", name: "Junior Scientist", earned: totalCompleted >= 3, icon: <FlaskConical className="w-5 h-5" />, desc: "Complete 3 missions." },
    { id: "streak2", name: "2-Day Streak", earned: streak >= 2, icon: <Award className="w-5 h-5" />, desc: "Complete a mission two days in a row." },
  ];
  return out;
}

const Icon = ({ kind }: { kind: Mission["icon"] }) => {
  const base = "w-5 h-5";
  switch (kind) {
    case "flask":
      return <FlaskConical className={base} />;
    case "leaf":
      return <Leaf className={base} />;
    case "rocket":
      return <Rocket className={base} />;
  }
};

export default function WonderMissionsDemo() {
  const [view, setView] = useState<"list" | "detail" | "progress">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const completedMissionIds = useMemo(
    () => new Set(progress.map((p) => p.missionId)),
    [progress]
  );

  const totalCompleted = completedMissionIds.size;
  const dates = uniqueDates(progress);
  const streak = calculateCurrentStreak(dates);
  const badges = badgeList(totalCompleted, streak);

  const selected = MISSIONS.find((m) => m.id == selectedId) || null;

  function completeMission(mid: string) {
    if (completedMissionIds.has(mid)) return;
    const rec: ProgressRecord = { missionId: mid, completedAtISO: todayISO() };
    setProgress((p) => [...p, rec]);
  }

  function resetDemo() {
    localStorage.removeItem(LS_KEY);
    setProgress([]);
    setHintIndex(0);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white text-slate-800">
      <div className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-lg">Wonder Missions</div>
              <div className="text-xs text-slate-500">Bite‑size STEM adventures (ages 6–11)</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}>Missions</Button>
            <Button variant={view === "progress" ? "default" : "ghost"} onClick={() => setView("progress")}>Progress</Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        <Card className="border-indigo-100 shadow-sm">
          <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-emerald-600 mt-0.5" />
              <div>
                <div className="font-semibold">Safety first</div>
                <div className="text-sm text-slate-600">Adult supervision recommended. Household materials only. No open flames or hazardous chemicals.</div>
              </div>
            </div>
            <div className="hidden sm:block">
              <Badge className="bg-emerald-600 text-white">Curated & kid‑safe</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {view === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-slate-600">Choose a mission to begin</div>
                <div className="text-sm">Completed: <span className="font-semibold">{totalCompleted}</span> · Streak: <span className="font-semibold">{streak} day{streak === 1 ? "" : "s"}</span></div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {MISSIONS.map((m) => (
                  <Card key={m.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                          {m.icon === "flask" ? <FlaskConical className="w-5 h-5" /> : m.icon === "leaf" ? <Leaf className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
                        </span>
                        {m.title}
                        {completedMissionIds.has(m.id) && (
                          <Badge className="ml-auto bg-indigo-600 text-white flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Done</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm">
                      <div className="text-slate-600">{m.summary}</div>
                      <div className="mt-2 text-xs text-slate-500">Age {m.ageMin}–{m.ageMax}</div>
                      <div className="mt-3">
                        <Button onClick={() => { setSelectedId(m.id); setHintIndex(0); setView("detail"); }} className="w-full">
                          Start mission <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 text-right">
                <Button variant="ghost" onClick={resetDemo}>Reset demo</Button>
              </div>
            </motion.div>
          )}

          {view === "detail" && selected && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <button className="mb-3 inline-flex items-center text-sm text-slate-600 hover:text-slate-800" onClick={() => setView("list")}> <ArrowLeft className="w-4 h-4 mr-1" /> Back to missions</button>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                      {selected.icon === "flask" ? <FlaskConical className="w-5 h-5" /> : selected.icon === "leaf" ? <Leaf className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
                    </span>
                    {selected.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="text-slate-700 mb-4">{selected.summary}</div>

                      <div className="mb-4">
                        <div className="font-semibold mb-1">Materials</div>
                        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                          {selected.materials.map((x) => <li key={x}>{x}</li>)}
                        </ul>
                      </div>

                      <div className="mb-4">
                        <div className="font-semibold mb-1">Steps</div>
                        <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
                          {selected.steps.map((x, i) => <li key={i}>{x}</li>)}
                        </ol>
                      </div>

                      {selected.learningPoints?.length > 0 && (
                        <div className="mb-4">
                          <div className="font-semibold mb-1">Why it works</div>
                          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                            {selected.learningPoints.map((x) => <li key={x}>{x}</li>)}
                          </ul>
                        </div>
                      )}

                      {selected.safetyNotes && (
                        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex gap-2">
                          <Shield className="w-4 h-4 mt-0.5" /> {selected.safetyNotes}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {!completedMissionIds.has(selected.id) ? (
                          <Button onClick={() => completeMission(selected.id)}>Mark completed</Button>
                        ) : (
                          <Button variant="secondary" disabled>Completed</Button>
                        )}
                        <Button variant="ghost" onClick={() => setView("progress")}>View progress</Button>
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <div className="rounded-2xl border bg-gradient-to-b from-indigo-50 to-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-5 h-5 text-indigo-700" />
                          <div className="font-semibold">AI Lab Buddy (Hints)</div>
                        </div>
                        <div className="text-xs text-slate-600 mb-3">Hints are limited to this mission to keep things safe and on-topic.</div>
                        <div className="text-sm p-3 rounded-lg bg-white border min-h-[72px]">
                          {selected.hints[hintIndex]}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setHintIndex((i) => Math.min(i + 1, selected.hints.length - 1))}
                            disabled={hintIndex >= selected.hints.length - 1}
                          >
                            Next hint
                          </Button>
                          <Button variant="ghost" onClick={() => setHintIndex(0)}>Reset hints</Button>
                        </div>
                        <div className="mt-3 text-xs text-slate-500">
                          Safety note: Hints won’t suggest new chemicals, heat, or risky steps.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {view === "progress" && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <button className="mb-3 inline-flex items-center text-sm text-slate-600 hover:text-slate-800" onClick={() => setView("list")}> <ArrowLeft className="w-4 h-4 mr-1" /> Back to missions</button>

              <div className="grid lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Overview</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-sm text-slate-600">Missions completed</div>
                    <div className="text-3xl font-semibold">{totalCompleted}</div>
                    <div className="mt-4 text-sm text-slate-600">Current streak</div>
                    <div className="text-2xl font-semibold">{streak} day{streak === 1 ? "" : "s"}</div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2"><CardTitle className="text-base">Badges</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {badges.map((b) => (
                        <div key={b.id} className={`rounded-xl border p-3 flex items-start gap-3 ${b.earned ? "bg-indigo-50 border-indigo-200" : "bg-white"}`}>
                          <div className={`p-2 rounded-lg ${b.earned ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>{b.icon}</div>
                          <div>
                            <div className="font-semibold text-sm flex items-center gap-2">{b.name} {b.earned && <CheckCircle2 className="w-4 h-4 text-indigo-700" />}</div>
                            <div className="text-xs text-slate-600">{b.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                  <CardHeader className="pb-2"><CardTitle className="text-base">History</CardTitle></CardHeader>
                  <CardContent>
                    {progress.length == 0 ? (
                      <div className="text-sm text-slate-600">No missions completed yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {progress
                          .slice()
                          .sort((a, b) => a.completedAtISO.localeCompare(b.completedAtISO))
                          .map((r, i) => {
                            const m = MISSIONS.find((x) => x.id === r.missionId)!;
                            return (
                              <div key={i} className="flex items-center justify-between text-sm border rounded-lg p-2">
                                <div className="flex items-center gap-2">
                                  <span className="p-1.5 rounded-lg bg-slate-100">{m.icon === "flask" ? <FlaskConical className="w-4 h-4" /> : m.icon === "leaf" ? <Leaf className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}</span>
                                  <div>
                                    <div className="font-medium">{m.title}</div>
                                    <div className="text-xs text-slate-500">Completed {r.completedAtISO}</div>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => { setSelectedId(m.id); setView("detail"); }}>View</Button>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 text-right">
                <Button variant="ghost" onClick={resetDemo}>Reset demo</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-8 text-xs text-slate-500">
        This is a local, no-backend demo. In a real build, parent login, secure storage, video, and push notifications would be added.
      </div>
    </div>
  );
}
