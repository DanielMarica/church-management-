import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/src/types/database';
import { Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardProps {
  profile: Profile;
}

interface Stats {
  totalChildren: number;
  totalTeams: number;
  upcomingClasses: number;
  activeCourses: number;
}

interface StatCard {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
}

interface AnnualEntry {
  month: string;
  present: number;
  absent: number;
}

interface DayEntry {
  label: string;
  present: number;
  absent: number;
}

// Recharts passes the raw data object through payload[0].payload —
// we type the custom tooltip props manually to avoid the broken generic.
interface MonthlyTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DayEntry }>;
}

interface AnnualTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

// ── Static data (replace with Supabase queries) ───────────────────────────────

const MONTHS: string[] = [
  'Jan','Fév','Mar','Avr','Mai','Jun',
  'Jul','Aoû','Sep','Oct','Nov','Déc',
];
const MONTHS_FULL: string[] = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const annualData: AnnualEntry[] = [
  { month: 'Jan', present: 18, absent: 6  },
  { month: 'Fév', present: 22, absent: 4  },
  { month: 'Mar', present: 25, absent: 3  },
  { month: 'Avr', present: 20, absent: 5  },
  { month: 'Mai', present: 28, absent: 2  },
  { month: 'Jun', present: 15, absent: 9  },
  { month: 'Jul', present: 10, absent: 14 },
  { month: 'Aoû', present: 8,  absent: 16 },
  { month: 'Sep', present: 26, absent: 3  },
  { month: 'Oct', present: 30, absent: 2  },
  { month: 'Nov', present: 27, absent: 3  },
  { month: 'Déc', present: 32, absent: 2  },
];

const monthlyDetail: Record<number, DayEntry[]> = {
  0:  [{label:'1er',present:18,absent:6},{label:'2e',present:24,absent:0},{label:'3e',present:12,absent:12},{label:'4e',present:20,absent:4}],
  1:  [{label:'1er',present:22,absent:2},{label:'2e',present:28,absent:0},{label:'3e',present:16,absent:8},{label:'4e',present:23,absent:1}],
  2:  [{label:'1er',present:25,absent:1},{label:'2e',present:31,absent:0},{label:'3e',present:19,absent:7},{label:'4e',present:27,absent:2},{label:'5e',present:24,absent:4}],
  3:  [{label:'1er',present:20,absent:4},{label:'2e',present:26,absent:0},{label:'3e',present:14,absent:10},{label:'4e',present:22,absent:2}],
  4:  [{label:'1er',present:28,absent:0},{label:'2e',present:34,absent:0},{label:'3e',present:22,absent:6},{label:'4e',present:30,absent:2}],
  5:  [{label:'1er',present:15,absent:9},{label:'2e',present:20,absent:4},{label:'3e',present:10,absent:14},{label:'4e',present:18,absent:6}],
  6:  [{label:'1er',present:10,absent:14},{label:'2e',present:14,absent:10},{label:'3e',present:6,absent:18},{label:'4e',present:12,absent:12}],
  7:  [{label:'1er',present:8,absent:16},{label:'2e',present:12,absent:12},{label:'3e',present:5,absent:19},{label:'4e',present:10,absent:14}],
  8:  [{label:'1er',present:26,absent:2},{label:'2e',present:32,absent:0},{label:'3e',present:20,absent:8},{label:'4e',present:28,absent:0}],
  9:  [{label:'1er',present:30,absent:0},{label:'2e',present:36,absent:0},{label:'3e',present:24,absent:6},{label:'4e',present:32,absent:2}],
  10: [{label:'1er',present:27,absent:1},{label:'2e',present:33,absent:0},{label:'3e',present:21,absent:7},{label:'4e',present:29,absent:3},{label:'5e',present:25,absent:2}],
  11: [{label:'1er',present:32,absent:0},{label:'2e',present:38,absent:0},{label:'3e',present:26,absent:6},{label:'4e',present:30,absent:2}],
};

const overallAvg: number = Math.round(
  annualData.reduce((s, d) => s + d.present, 0) / annualData.length,
);
const bestMonth: AnnualEntry = annualData.reduce(
  (b, d) => (d.present > b.present ? d : b),
  { present: 0, absent: 0, month: '' },
);
const worstMonth: AnnualEntry = annualData.reduce(
  (b, d) => (d.present < b.present ? d : b),
  { present: 999, absent: 0, month: '' },
);

// ── Custom Tooltips ───────────────────────────────────────────────────────────

const MonthlyTooltip = ({ active, payload }: MonthlyTooltipProps) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const total = p.present + p.absent;
  const rate = total ? Math.round((p.present / total) * 100) : 0;
  return (
    <div className="bg-card border border-border rounded-lg p-2 text-xs shadow-md">
      <p className="font-semibold mb-1">{p.label}</p>
      <p className="text-green-500">✓ Présents : <strong>{p.present}</strong></p>
      <p className="text-red-400">✗ Absents : <strong>{p.absent}</strong></p>
      <p className="text-muted-foreground mt-1 pt-1 border-t border-border">
        Taux : <strong className="text-yellow-500">{rate}%</strong>
      </p>
    </div>
  );
};

const AnnualTooltip = ({ active, payload, label }: AnnualTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-2 text-xs shadow-md">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'present' ? '✓ Présents' : '✗ Absents'} : <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({ profile }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalChildren: 0, totalTeams: 0, upcomingClasses: 0, activeCourses: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [chartView, setChartView] = useState<'monthly' | 'annual'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const isOfflineMode = !supabase;

  useEffect(() => { loadStats(); }, []);

  const loadStats = async (): Promise<void> => {
    if (!supabase) { setLoading(false); return; }
    try {
      const [children, teams, planning, courses] = await Promise.all([
        supabase.from('children').select('id', { count: 'exact', head: true }),
        supabase.from('teams').select('id', { count: 'exact', head: true }),
        supabase.from('planning').select('id', { count: 'exact', head: true })
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .eq('status', 'scheduled'),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      setStats({
        totalChildren:   children.count  ?? 0,
        totalTeams:      teams.count     ?? 0,
        upcomingClasses: planning.count  ?? 0,
        activeCourses:   courses.count   ?? 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthData: DayEntry[] = monthlyDetail[selectedMonth] ?? [];

  const monthStats = useMemo(() => {
    const totalPresent = monthData.reduce((s, d) => s + d.present, 0);
    const totalAbsent  = monthData.reduce((s, d) => s + d.absent,  0);
    const cap = totalPresent + totalAbsent;
    return {
      rate:         cap ? Math.round((totalPresent / cap) * 100) : 0,
      totalPresent,
      totalDays:    monthData.length,
    };
  }, [monthData]);

  const statCards: StatCard[] = [
    { title: 'Total Children',        value: stats.totalChildren,   icon: Users,    description: 'Registered students' },
    { title: 'Live Children Present', value: stats.totalChildren,   icon: Users,    description: 'Present today' },
    { title: 'Upcoming Classes',      value: stats.upcomingClasses, icon: Calendar, description: 'Scheduled sessions' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold mb-1">
          Welcome back, {profile?.full_name ?? 'User'}!
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Heres an overview of your Sunday School activities
        </p>
        {isOfflineMode && (
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Mode local actif: données de démonstration (Supabase désactivé).
          </p>
        )}
      </div>

      {/* ── Two equal columns — fills remaining height ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">

        {/* LEFT — Stats + Quick Actions */}
        <div className="flex flex-col gap-4 h-full">

          {/* Stats — 3 cards in a row */}
          <div className="grid grid-cols-3 gap-3">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3 md:px-4">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="pb-3 px-3 md:px-4">
                    <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions — grows to fill remaining height */}
          <Card className="border-0 shadow-sm flex-1">
            <CardHeader className="pb-2 pt-4 px-3 md:px-4">
              <CardTitle className="text-sm md:text-base">Quick Actions</CardTitle>
              <CardDescription className="text-xs">Common tasks to get started</CardDescription>
            </CardHeader>
            <CardContent className="px-3 md:px-4 pb-4">
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="h-auto p-3 flex items-center justify-start gap-2 hover:bg-accent hover:text-accent-foreground">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-xs">Add New Child</h3>
                    <p className="text-xs text-muted-foreground">Register a student</p>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-3 flex items-center justify-start gap-2 hover:bg-accent hover:text-accent-foreground">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-xs">Schedule Class</h3>
                    <p className="text-xs text-muted-foreground">Plan a session</p>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto p-3 flex items-center justify-start gap-2 hover:bg-accent hover:text-accent-foreground">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-xs">Create Course</h3>
                    <p className="text-xs text-muted-foreground">Start curriculum</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Attendance Charts */}
        <div className="flex flex-col h-full">
          <Card className="border-0 shadow-sm flex-1">
            <CardHeader className="pb-2 pt-4 px-3 md:px-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-sm md:text-base">Statistiques de Présence</CardTitle>
                  <CardDescription className="text-xs">Fréquentation des enfants par dimanche</CardDescription>
                </div>
                {/* Toggle Mensuel / Annuel */}
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                  {(['monthly', 'annual'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setChartView(v)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                        chartView === v
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                      }`}
                    >
                      {v === 'monthly' ? 'Mensuel' : 'Annuel'}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-3 md:px-4 pb-4 space-y-3">

              {/* ── MONTHLY ── */}
              {chartView === 'monthly' && (
                <>
                  {/* Month pills */}
                  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                    {MONTHS.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedMonth(i)}
                        className={`flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                          selectedMonth === i
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Dimanches',       value: monthStats.totalDays    },
                      { label: 'Total présences',  value: monthStats.totalPresent },
                      { label: 'Taux moyen',       value: `${monthStats.rate}%`  },
                    ].map((s) => (
                      <Card key={s.label} className="border-0 shadow-sm bg-muted/40">
                        <CardContent className="px-3 py-2">
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className="text-lg font-bold">{s.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Bar chart */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {MONTHS_FULL[selectedMonth]} — présence par dimanche
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={monthData} barCategoryGap="30%">
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          width={24}
                        />
                        <Tooltip content={<MonthlyTooltip />} cursor={{ fill: 'rgba(128,128,128,0.08)' }} />
                        <Bar dataKey="present" name="Présents" fill="hsl(142 76% 36%)" radius={[4,4,0,0]} />
                        <Bar dataKey="absent"  name="Absents"  fill="hsl(0 72% 51%)"   radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 justify-center mt-1">
                      {[
                        { color: 'hsl(142 76% 36%)', label: 'Présents' },
                        { color: 'hsl(0 72% 51%)',   label: 'Absents'  },
                      ].map((l) => (
                        <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── ANNUAL ── */}
              {chartView === 'annual' && (
                <>
                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Moy. présences', value: overallAvg       },
                      { label: 'Meilleur mois',  value: bestMonth.month  },
                      { label: 'Mois creux',     value: worstMonth.month },
                    ].map((s) => (
                      <Card key={s.label} className="border-0 shadow-sm bg-muted/40">
                        <CardContent className="px-3 py-2">
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className="text-lg font-bold">{s.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Line chart — présents + absents */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Évolution annuelle — présents &amp; absents
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={annualData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          width={24}
                        />
                        <Tooltip
                          content={<AnnualTooltip />}
                          cursor={{ stroke: 'rgba(128,128,128,0.2)', strokeWidth: 1 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="present"
                          stroke="hsl(142 76% 36%)"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="absent"
                          stroke="hsl(0 72% 51%)"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 justify-center mt-1">
                      {[
                        { color: 'hsl(142 76% 36%)', label: 'Présents' },
                        { color: 'hsl(0 72% 51%)',   label: 'Absents'  },
                      ].map((l) => (
                        <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-8 h-0.5 rounded" style={{ background: l.color }} />
                          {l.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}