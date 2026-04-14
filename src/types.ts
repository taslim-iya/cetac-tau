export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type EventStatus = 'planned' | 'confirmed' | 'completed' | 'cancelled';
export type ContactType = 'team' | 'investor' | 'advisor' | 'alumni' | 'partner' | 'sponsor' | 'speaker' | 'prospect';
export type PartnershipStatus = 'prospect' | 'contacted' | 'in_discussion' | 'agreed' | 'active';
export type ContentStatus = 'idea' | 'in_progress' | 'review' | 'published';
export type OutreachStatus = 'draft' | 'sent' | 'replied' | 'meeting_booked' | 'no_response';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  type: ContactType;
  organisation: string;
  role: string;
  notes: string;
  tags: string[];
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  responsibilities: string;
  email: string;
  phone: string;
  linkedin: string;
  status: 'active' | 'potential' | 'new';
  vertical: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: string[];
  dueDate: string;
  week: number;
  category: string;
  completedAt: string;
  createdAt: string;
}

export interface CETACEvent {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  week: number;
  status: EventStatus;
  speakers: string[];
  sponsors: string[];
  attendeeCount: number;
  format: string;
  postEventNotes: string;
  createdAt: string;
}

export interface Partnership {
  id: string;
  name: string;
  type: 'business_school' | 'cambridge_internal' | 'investor' | 'sponsor' | 'advisor' | 'other';
  contactPerson: string;
  contactEmail: string;
  status: PartnershipStatus;
  notes: string;
  lastContactDate: string;
  nextAction: string;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  title: string;
  type: 'case_study' | 'newsletter' | 'linkedin_post' | 'playbook' | 'event_recap';
  status: ContentStatus;
  author: string;
  subject: string;
  publishDate: string;
  platform: string;
  notes: string;
  createdAt: string;
}

export interface Outreach {
  id: string;
  contactName: string;
  contactEmail: string;
  subject: string;
  message: string;
  status: OutreachStatus;
  sentDate: string;
  followUpDate: string;
  category: string;
  notes: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  type: 'event' | 'task' | 'meeting' | 'reminder' | 'deadline';
  description: string;
  completed: boolean;
  linkedTaskId: string;
  linkedEventId: string;
}

export interface AppSettings {
  openaiApiKey: string;
  clubEmail: string;
  notifyEmail: string;
}
