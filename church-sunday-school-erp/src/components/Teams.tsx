import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';
import type { Profile } from '../types/database';

interface TeamsProps {
  profile: Profile;
}

export default function Teams({ profile }: TeamsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage class groups and teams</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Team
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teams List</CardTitle>
          <CardDescription>All class groups in your Sunday School</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No teams created yet</p>
            <p className="text-sm mt-2">Click Add Team to create your first group</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
