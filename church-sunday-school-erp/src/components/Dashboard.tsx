import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/src/types/database';
import { Users, Calendar, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';

interface DashboardProps {
  profile: Profile;
}

interface Stats {
  totalChildren: number;
  totalTeams: number;
  upcomingClasses: number;
  activeCourses: number;
}

export default function Dashboard({ profile }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalChildren: 0,
    totalTeams: 0,
    upcomingClasses: 0,
    activeCourses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [children, teams, planning, courses] = await Promise.all([
        supabase.from('children').select('id', { count: 'exact', head: true }),
        supabase.from('teams').select('id', { count: 'exact', head: true }),
        supabase
          .from('planning')
          .select('id', { count: 'exact', head: true })
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .eq('status', 'scheduled'),
        supabase
          .from('courses')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
      ]);

      setStats({
        totalChildren: children.count || 0,
        totalTeams: teams.count || 0,
        upcomingClasses: planning.count || 0,
        activeCourses: courses.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Children',
      value: stats.totalChildren,
      icon: Users,
      description: 'Registered students',
    },
    {
      title: 'Active Teams',
      value: stats.totalTeams,
      icon: Users,
      description: 'Class groups',
    },
    {
      title: 'Upcoming Classes',
      value: stats.upcomingClasses,
      icon: Calendar,
      description: 'Scheduled sessions',
    },
    {
      title: 'Active Courses',
      value: stats.activeCourses,
      icon: BookOpen,
      description: 'Current curriculum',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - Smaller */}
      <div>
        <h1 className="text-2xl font-bold mb-1">
          Welcome back, {profile?.full_name || 'User'}!
        </h1>
        <p className="text-sm text-muted-foreground">
          Heres an overview of your Sunday School activities
        </p>
      </div>

      {/* Stats Grid - Much Smaller */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions - Smaller */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription className="text-xs">Common tasks to get started</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button
              variant="outline"
              className="h-auto p-3 flex items-center justify-start gap-2 hover:bg-accent"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-xs">Add New Child</h3>
                <p className="text-xs text-muted-foreground">Register a student</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-3 flex items-center justify-start gap-2 hover:bg-accent"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-xs">Schedule Class</h3>
                <p className="text-xs text-muted-foreground">Plan a session</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-3 flex items-center justify-start gap-2 hover:bg-accent"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-xs">Create Course</h3>
                <p className="text-xs text-muted-foreground">Start curriculum</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity - Minimal */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-sm">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-center py-2 text-muted-foreground">
            <p className="text-xs">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}