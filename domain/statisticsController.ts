import { CROSSES_FOR_DETENTION, TICKS_FOR_MERIT } from '../constants/config';
import { getClasses } from '../models/classModel';
import { getAllStudents } from '../models/studentModel';
import { getAllArchives, getAllEvents } from '../models/historyModel';
import type { EventRow, EventType, StudentWithClass } from '../types/domain';

export type StatsPeriod = 'week' | 'month' | 'trimester';
type ClimateStatus = 'positive' | 'stable' | 'attention' | 'tense' | 'low-positive' | 'empty';
type ClimateTone = 'success' | 'neutral' | 'warning' | 'danger';

const PERIOD_DAYS: Record<StatsPeriod, number> = { week: 7, month: 30, trimester: 90 };
const NO_EVENT_DAYS = 14;
const WATCH_THRESHOLD = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

// Tones per climate status. Labels and recommendations are localised in the view
// via the i18n keys climateLabel_<status> / climateRec_<status>.
const CLIMATE_TONE: Record<ClimateStatus, ClimateTone> = {
  positive: 'success',
  stable: 'neutral',
  attention: 'warning',
  tense: 'danger',
  'low-positive': 'warning',
  empty: 'neutral'
};

interface ArchiveAccumulator {
  trimester: number;
  archivedAt: string;
  students: number;
  merits: number;
  detentions: number;
  ticks: number;
  crosses: number;
}

export interface StatisticsOptions {
  period?: StatsPeriod;
  classId?: string | null;
}

const startOfToday = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

// A forgotten notebook is now its own 'forgot' event type. Older data recorded
// it as a cross with a "carnet" reason, so keep matching that too.
const isForgottenNotebook = (event: EventRow): boolean =>
  event.type === 'forgot' ||
  (event.type === 'cross' && /carnet/i.test(String(event.reason || '')));

const computeClimate = ({
  ticks,
  crosses,
  studentCount
}: {
  ticks: number;
  crosses: number;
  studentCount: number;
}): ClimateStatus => {
  const total = ticks + crosses;
  if (total === 0) return 'empty';
  const ratio = ticks / total;
  if (crosses > ticks && crosses >= 6) return 'tense';
  if (ratio < 0.45) return 'attention';
  const positiveFloor = Math.max(4, Math.round(studentCount * 0.5));
  if (ticks < positiveFloor) return 'low-positive';
  if (ratio >= 0.7) return 'positive';
  return 'stable';
};

const studentLabel = (student: { lastName?: string | null; firstName?: string | null }): string =>
  `${String(student.lastName || '').toUpperCase()} ${student.firstName || ''}`.trim();

/**
 * Aggregates everything the teacher dashboard needs for a given period and class scope.
 */
export const getClassroomStatistics = async ({
  period = 'week',
  classId = null
}: StatisticsOptions = {}) => {
  const [classes, students, events, archives] = await Promise.all([
    getClasses(),
    getAllStudents(),
    getAllEvents(),
    getAllArchives()
  ]);

  const classOf = new Map(students.map((student) => [student.id, student.classId]));
  const scopedStudents: StudentWithClass[] =
    classId == null ? students : students.filter((s) => s.classId === classId);
  const inScope = (studentId: string): boolean => classId == null || classOf.get(studentId) === classId;

  const days = PERIOD_DAYS[period] || PERIOD_DAYS.week;
  const periodStart = new Date(Date.now() - days * DAY_MS);
  const todayStart = startOfToday();

  const activeEvents = events.filter((event) => !event.cancelled && inScope(event.studentId));
  const periodEvents = activeEvents.filter((event) => new Date(event.createdAt) >= periodStart);
  const todayEvents = activeEvents.filter((event) => new Date(event.createdAt) >= todayStart);

  const countType = (list: EventRow[], type: EventType): number =>
    list.filter((event) => event.type === type).length;

  // Evolution counters over the selected period.
  const periodTicks = countType(periodEvents, 'tick');
  const periodCrosses = countType(periodEvents, 'cross');
  const periodMerits = periodEvents.filter(
    (event) => event.type === 'tick' && event.previousTicks === TICKS_FOR_MERIT - 1
  ).length;
  const periodDetentions = periodEvents.filter(
    (event) => event.type === 'cross' && event.previousCrosses === CROSSES_FOR_DETENTION - 1
  ).length;

  // Today snapshot.
  const todayTicks = countType(todayEvents, 'tick');
  const todayCrosses = countType(todayEvents, 'cross');
  const todayForgotten = todayEvents.filter(isForgottenNotebook).length;

  // Students to keep an eye on (live counters, not period-bound).
  const toWatch = scopedStudents
    .filter((student) => student.crosses >= WATCH_THRESHOLD)
    .map((student) => ({
      ...student,
      metaKey: 'metaCrossesOngoing',
      metaParams: { count: student.crosses }
    }))
    .sort((a, b) => b.crosses - a.crosses);

  // Students linked to a forgotten-notebook cross during the period.
  const forgottenIds = new Set(
    periodEvents.filter(isForgottenNotebook).map((e) => e.studentId)
  );
  const forgottenNotebooks = scopedStudents
    .filter((student) => forgottenIds.has(student.id))
    .map((student) => ({ ...student, metaKey: 'metaForgottenNotebook' }));

  // Last activity per student to surface the ones going unnoticed.
  const lastEventAt = new Map<string, number>();
  for (const event of activeEvents) {
    const time = new Date(event.createdAt).getTime();
    const previous = lastEventAt.get(event.studentId);
    if (previous == null || time > previous) {
      lastEventAt.set(event.studentId, time);
    }
  }
  const noEventCutoff = Date.now() - NO_EVENT_DAYS * DAY_MS;
  const noRecentEvent = scopedStudents
    .filter((student) => {
      const last = lastEventAt.get(student.id);
      return last == null || last < noEventCutoff;
    })
    .map((student) => {
      const last = lastEventAt.get(student.id);
      const daysSince = last != null ? Math.floor((Date.now() - last) / DAY_MS) : null;
      return {
        ...student,
        daysSinceLastEvent: daysSince,
        ...(daysSince == null
          ? { metaKey: 'metaNoEvent' }
          : { metaKey: 'metaDaysSince', metaParams: { days: daysSince } })
      };
    })
    .sort((a, b) => (lastEventAt.get(a.id) || 0) - (lastEventAt.get(b.id) || 0));

  // Top 3 to encourage / to reframe, based on live counters.
  const encourage = scopedStudents
    .map((student) => ({
      ...student,
      score: student.merits * 4 + student.ticks,
      metaKey: 'metaEncourage',
      metaParams: { merits: student.merits, ticks: student.ticks }
    }))
    .filter((student) => student.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const reframe = scopedStudents
    .map((student) => ({
      ...student,
      score: student.detentions * 4 + student.crosses,
      metaKey: 'metaReframe',
      metaParams: { detentions: student.detentions, crosses: student.crosses }
    }))
    .filter((student) => student.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const climateStatus = computeClimate({
    ticks: periodTicks,
    crosses: periodCrosses,
    studentCount: scopedStudents.length
  });
  const climate = { status: climateStatus, tone: CLIMATE_TONE[climateStatus] };

  // Trimester archives, aggregated per trimester within the current scope.
  const archiveByTrimester = new Map<number, ArchiveAccumulator>();
  for (const archive of archives) {
    if (classId != null && classOf.get(archive.studentId) !== classId) continue;
    const current: ArchiveAccumulator = archiveByTrimester.get(archive.trimester) || {
      trimester: archive.trimester,
      archivedAt: archive.archivedAt,
      students: 0,
      merits: 0,
      detentions: 0,
      ticks: 0,
      crosses: 0
    };
    current.students += 1;
    current.merits += archive.merits || 0;
    current.detentions += archive.detentions || 0;
    current.ticks += archive.totalTicks || 0;
    current.crosses += archive.totalCrosses || 0;
    if (new Date(archive.archivedAt) > new Date(current.archivedAt)) current.archivedAt = archive.archivedAt;
    archiveByTrimester.set(archive.trimester, current);
  }
  const archiveList = [...archiveByTrimester.values()].sort((a, b) => b.trimester - a.trimester);

  const hasData =
    activeEvents.length > 0 ||
    scopedStudents.some((s) => s.ticks || s.crosses || s.merits || s.detentions) ||
    archiveList.length > 0;

  return {
    period,
    classId,
    hasData,
    classes,
    climate,
    today: {
      toWatch: toWatch.length,
      ticks: todayTicks,
      crosses: todayCrosses,
      forgottenNotebooks: todayForgotten
    },
    quickActions: { toWatch, forgottenNotebooks, noRecentEvent },
    top: { encourage, reframe },
    evolution: {
      ticks: periodTicks,
      crosses: periodCrosses,
      merits: periodMerits,
      detentions: periodDetentions
    },
    archives: archiveList
  };
};

export { studentLabel };
