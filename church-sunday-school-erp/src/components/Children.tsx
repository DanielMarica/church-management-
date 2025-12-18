import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';
import type { Profile } from '../types/database';

interface ChildrenProps {
  profile: Profile;
}

export default function Children({ profile }: ChildrenProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Children</h1>
          <p className="text-muted-foreground">Manage Sunday School students</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Child
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>All registered children in your Sunday School</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No children registered yet</p>
            <p className="text-sm mt-2">Click Add Child to register your first student</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
