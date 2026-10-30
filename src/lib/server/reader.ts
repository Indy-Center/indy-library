import { error } from '@sveltejs/kit';
import type { SessionContext } from '@indy-center/identity';
import { CmsUnavailableError } from '$lib/server/cms';
import { isTrainingStaff } from '$lib/permissions';
import type {
	CataloguePosition,
	CourseSummary,
	CourseVersionDocument,
	LessonPlan,
	Scenario,
	ScenarioPosition,
	TaskRef
} from '$lib/server/cms/types';

/**
 * What a reader may see, decided per request. Every page load goes through here rather than
 * reading `locals.cms` itself.
 */

/** Runs a read from the CMS, turning "the CMS is down and nothing is kept" into a 503 page. */
export async function fromCms<T>(read: () => Promise<T>): Promise<T> {
	try {
		return await read();
	} catch (err) {
		if (err instanceof CmsUnavailableError) {
			console.error('[indy-library]', err);
			error(503, 'The library cannot reach its courses right now. Try again in a few minutes.');
		}
		throw err;
	}
}

/** Whether the request asks for the course's draft rather than its current version. */
export function wantsDraft(url: URL): boolean {
	return url.searchParams.get('version') === 'draft';
}

/** A course's draft is for its authors (by CID), the Training Admin and lead instructors. */
export function maySeeDraft(
	session: SessionContext | null,
	course: { authors: string[] }
): boolean {
	if (!session) return false;
	return isTrainingStaff(session.roles) || course.authors.includes(session.user.cid);
}

/** The course as the CMS lists it, or undefined when there is no such course. */
export async function courseSummary(
	locals: App.Locals,
	code: string
): Promise<CourseSummary | undefined> {
	const { courses } = await fromCms(() => locals.cms.courseList());
	return courses.find((course) => course.code === code);
}

/**
 * The version of a course the request asks for, or a 404: the current version, or with
 * `?version=draft` the draft. Older published versions are never read.
 *
 * Whether the reader may see the draft is decided from the course list before the draft is
 * fetched, so a draft is never read for someone who may not see it. To them it is a 404, as if
 * there were none.
 */
export async function courseVersion(
	locals: App.Locals,
	code: string,
	url: URL
): Promise<CourseVersionDocument> {
	if (wantsDraft(url)) {
		const course = await courseSummary(locals, code);
		if (!course?.draftVersion || !maySeeDraft(locals.session, course)) {
			error(404, 'There is no such course.');
		}
	}
	const doc = await fromCms(() =>
		locals.cms.courseVersion(code, wantsDraft(url) ? 'draft' : 'current')
	);
	if (!doc) error(404, 'There is no such course.');
	return doc;
}

/**
 * Whether the reader may see this course's teacher notes: the Training Admin and lead
 * instructors on every course, and a teacher on the courses training-tools says they may teach.
 *
 * Ask only when the page has teacher notes to show: it is a call to another Worker. When
 * training-tools does not answer in time, the answer is no.
 */
export async function maySeeTeacherNotes(locals: App.Locals, courseCode: string): Promise<boolean> {
	const session = locals.session;
	if (!session) return false;
	if (isTrainingStaff(session.roles)) return true;
	const taught = await locals.teaching.coursesTaught(session.user.cid);
	return taught?.includes(courseCode) ?? false;
}

/**
 * Teacher notes as the page is sent them: the notes when the reader may see them, otherwise
 * null. Notes are only ever sent through this, so a reader who may not see them never receives
 * them, not even hidden in the page.
 */
export function teacherNotes(notes: string, shown: boolean): string | null {
	return shown && notes.trim() ? notes : null;
}

/** Whether any of these items carries teacher notes, so there is something to decide. */
export function hasTeacherNotes(items: { teacherNotes: string }[]): boolean {
	return items.some((item) => item.teacherNotes.trim() !== '');
}

/** What every course page says about the version it shows. */
export function versionOf(doc: CourseVersionDocument) {
	return { number: doc.version.number, isDraft: doc.version.status === 'draft' };
}

/** A lesson plan of the version, with the module it sits in, or a 404. */
export function findLessonPlan(
	doc: CourseVersionDocument,
	id: string
): { module: CourseVersionDocument['modules'][number]; lessonPlan: LessonPlan } {
	for (const module of doc.modules) {
		const lessonPlan = module.lessonPlans.find((lp) => lp.id === id);
		if (lessonPlan) return { module, lessonPlan };
	}
	error(404, 'This course has no such lesson plan.');
}

/**
 * A scenario the version offers, with the lesson plans that offer it, or a 404. A scenario
 * belongs to its course, but the version only carries those its lesson plans offer, so one no
 * lesson plan of this version offers is not shown.
 */
export function findScenario(
	doc: CourseVersionDocument,
	id: string
): { scenario: Scenario; offeredBy: LessonPlan[] } {
	const offeredBy = doc.modules
		.flatMap((module) => module.lessonPlans)
		.filter((lp) => lp.scenarios.some((s) => s.id === id));
	const scenario = offeredBy[0]?.scenarios.find((s) => s.id === id);
	if (!scenario) error(404, 'This course offers no such scenario.');
	return { scenario, offeredBy };
}

const DIFFICULTIES = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const;

/** A scenario's difficulty as the page shows it: Easy, Medium, Hard, or nothing. */
export function difficultyLabel(difficulty: Scenario['difficulty']): string {
	return difficulty ? DIFFICULTIES[difficulty] : '';
}

/**
 * The catalogue's positions, for Centerline's `Position` to look scenario positions up in
 * (decision 0060). When the CMS cannot be read and no copy is kept, there are none, as
 * Centerline's positions lookup asks: every position then shows its callsign alone, and the
 * page still renders.
 */
export async function cataloguePositions(locals: App.Locals): Promise<CataloguePosition[]> {
	try {
		return (await locals.cms.catalogue()).positions;
	} catch (err) {
		if (err instanceof CmsUnavailableError) {
			console.error('[indy-library] no positions:', err);
			return [];
		}
		throw err;
	}
}

/**
 * A scenario's position as the page hands it to `Position`: the vNAS id (its `positionId`) and
 * callsign the scenario names, and whether the catalogue marks it retired. A position the
 * catalogue lacks is not retired; `Position` shows its callsign alone.
 */
export type ShownPosition = ScenarioPosition & { retired: boolean };

/** Turns a scenario's positions into what the page shows, looked up in the catalogue's. */
export async function positionsShown(
	locals: App.Locals
): Promise<(position: ScenarioPosition) => ShownPosition> {
	const retired = new Set(
		(await cataloguePositions(locals)).filter((p) => p.retired).map((p) => p.id)
	);
	return ({ id, callsign }) => ({ id, callsign, retired: retired.has(id) });
}

/** A task as a link to its page shows it. */
export function taskRef(task: TaskRef): TaskRef {
	return { id: task.id, number: task.number, name: task.name };
}
