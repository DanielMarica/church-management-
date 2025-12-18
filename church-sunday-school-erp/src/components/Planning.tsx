import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';
import type { Profile } from '../types/database';

interface PlanningProps {
  profile: Profile;
}

export default function Planning({ profile }: PlanningProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planning</h1>
          <p className="text-muted-foreground">Schedule classes and events</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Class
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>Upcoming scheduled classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No classes scheduled yet</p>
            <p className="text-sm mt-2">Click Schedule Class to plan your first session</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
