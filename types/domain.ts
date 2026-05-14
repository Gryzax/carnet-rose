// Core domain row shapes — these are what the app works with everywhere.
//
// Ids are client-generated UUIDs (see utils/uuid.ts). They double as the
// `local_id` used to upsert into Supabase, so an entity keeps the same id
// whether it was created online or offline.

export interface ClassRow {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ClassWithStats extends ClassRow {
  studentCount: number;
  totalMerits: number;
  totalDetentions: number;
}

export interface StudentRow {
  id: string;
  classId: string;
  firstName: string;
  lastName: string;
  ticks: number;
  crosses: number;
  merits: number;
  detentions: number;
  currentTrimester: number;
}

export interface StudentWithClass extends StudentRow {
  className: string;
}

export type EventType = 'tick' | 'cross';

export interface EventRow {
  id: string;
  studentId: string;
  type: EventType;
  reason: string | null;
  trimester: number;
  createdAt: string;
  previousTicks: number;
  previousCrosses: number;
  newTicks: number;
  newCrosses: number;
  cancelled: 0 | 1;
}

export interface ArchiveRow {
  id: string;
  studentId: string;
  trimester: number;
  merits: number;
  detentions: number;
  totalTicks: number;
  totalCrosses: number;
  archivedAt: string;
}

export interface StudentCounters {
  ticks: number;
  crosses: number;
  merits: number;
  detentions: number;
  currentTrimester: number;
}
