import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';
import type { Profile } from '../types/database';

interface ForumProps {
  profile: Profile;
}

export default function Forum({ profile }: ForumProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Forum</h1>
          <p className="text-muted-foreground">Discuss and share with the community</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forum Posts</CardTitle>
          <CardDescription>Community discussions and announcements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No posts yet</p>
            <p className="text-sm mt-2">Click New Post to start a discussion</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
