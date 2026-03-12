import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';
import type { Profile } from '../types/database';

interface LessonStocksProps {
  profile: Profile;
}

export default function LessonStocks({ profile }: LessonStocksProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lesson Stocks</h1>
          <p className="text-muted-foreground">Teaching resources and materials library</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Library</CardTitle>
          <CardDescription>Teaching materials and lesson resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No resources available yet</p>
            <p className="text-sm mt-2">Click Add Resource to upload teaching materials</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
