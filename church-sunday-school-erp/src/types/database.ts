// Database Types for Church Sunday School ERP

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'parent';
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: 'male' | 'female';
  parent_id?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  address?: string;
  medical_notes?: string;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  age_group?: string;
  color?: string;
  max_capacity?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  child_id: string;
  joined_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  duration_weeks?: number;
  age_group?: string;
  objectives?: string;
  materials_needed?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  week_number?: number;
  lesson_number?: number;
  bible_reference?: string;
  key_verse?: string;
  objective?: string;
  content?: string;
  activities?: string;
  materials?: string;
  homework?: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface LessonStock {
  id: string;
  title: string;
  category?: string;
  description?: string;
  age_group?: string;
  materials_needed?: string;
  instructions?: string;
  file_url?: string;
  tags?: string[];
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Planning {
  id: string;
  team_id: string;
  lesson_id?: string;
  teacher_id?: string;
  title: string;
  description?: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  planning_id: string;
  child_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  recorded_by: string;
  recorded_at: string;
}

export interface Formation {
  id: string;
  title: string;
  description?: string;
  type: 'workshop' | 'seminar' | 'training' | 'conference';
  scheduled_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  instructor?: string;
  max_participants?: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  materials_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FormationParticipant {
  id: string;
  formation_id: string;
  teacher_id: string;
  registration_date: string;
  attendance_status: 'registered' | 'attended' | 'absent' | 'cancelled';
  certificate_issued: boolean;
}

export interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ForumPost {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}