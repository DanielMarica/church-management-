import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';
import type { Profile } from '../types/database';

interface FormationProps {
  profile: Profile;
}

export default function Formation({ profile }: FormationProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Formation</h1>
          <p className="text-muted-foreground">Teacher training and development</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Formation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formation Programs</CardTitle>
          <CardDescription>Training sessions for teachers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No formation programs yet</p>
            <p className="text-sm mt-2">Click Add Formation to create a training program</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
