import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';
import type { Profile } from '../types/database';

interface CoursesProps {
  profile: Profile;
}

export default function Courses({ profile }: CoursesProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">Manage curriculum and courses</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Course
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Courses List</CardTitle>
          <CardDescription>All courses in your Sunday School</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No courses created yet</p>
            <p className="text-sm mt-2">Click Add Course to create your first course</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
