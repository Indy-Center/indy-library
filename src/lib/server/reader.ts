import { error } from '@sveltejs/kit';
import type { SessionContext } from '@indy-center/identity';
import { CmsUnavailableError } from '$lib/server/cms';
import { isTrainingStaff } from '$lib/permissions';
import type { ShownPosition } from '$lib/positions';
import type {
	Catalogue,
	CourseSummary,
	CourseVersionDocument,
	LessonPlan,
	LessonPlanResource,
	LessonPlanTask,
	PublicPosition,
	Scenario,
	ScenarioEvent,
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

/** A lesson plan as a page may be sent it: teacher-only material is null, or left out. */
export type SentLessonPlan = Omit<LessonPlan, 'tasks' | 'resources' | 'scenarios'> & {
	tasks: (Omit<LessonPlanTask, 'teacherNotes'> & { teacherNotes: string | null })[];
	resources: (Omit<LessonPlanResource, 'note'> & { note: string | null })[];
	scenarios: (Omit<Scenario, 'teacherPosition' | 'description' | 'events' | 'atctrainer'> & {
		teacherPosition: string | null;
		description: string | null;
		events: ScenarioEvent[] | null;
		atctrainer: string | null;
	})[];
};

/**
 * Whether the lesson plan holds any teacher-only material (decision 0076), so there is
 * something to decide. Every teacher-only field is checked here; add new ones here too.
 */
function hasTeacherOnly(lessonPlan: LessonPlan): boolean {
	const set = (text: string | null) => (text ?? '').trim() !== '';
	return (
		lessonPlan.tasks.some((task) => set(task.teacherNotes)) ||
		lessonPlan.resources.some((resource) => resource.teacherOnly || set(resource.note)) ||
		lessonPlan.scenarios.some(
			(scenario) =>
				set(scenario.teacherPosition) ||
				set(scenario.description) ||
				scenario.events.length > 0 ||
				set(scenario.atctrainer)
		)
	);
}

/**
 * A lesson plan as the page may send it to this reader, and whether it carries teacher-only
 * material. Teacher-only material (decisions 0017, 0076) is a task's teacher notes, a
 * teacher-only resource and every resource's note, and a scenario's teacher position,
 * description, events and ATCTrainer id. A reader who may not see it gets no teacher-only
 * resources and null for the rest, so it never reaches the browser. Lesson plans are only ever
 * sent through this.
 *
 * training-tools is asked only when the lesson plan has some to decide on.
 */
export async function lessonPlanForReader(
	locals: App.Locals,
	courseCode: string,
	lessonPlan: LessonPlan
): Promise<{ lessonPlan: SentLessonPlan; showsTeacherOnly: boolean }> {
	const shown = hasTeacherOnly(lessonPlan) && (await maySeeTeacherNotes(locals, courseCode));
	return {
		showsTeacherOnly: shown,
		lessonPlan: {
			...lessonPlan,
			tasks: lessonPlan.tasks.map((task) => ({
				...task,
				teacherNotes: teacherNotes(task.teacherNotes, shown)
			})),
			resources: lessonPlan.resources
				.filter((resource) => shown || !resource.teacherOnly)
				.map((resource) => ({ ...resource, note: teacherNotes(resource.note, shown) })),
			scenarios: lessonPlan.scenarios.map((scenario) => ({
				...scenario,
				teacherPosition: shown ? scenario.teacherPosition : null,
				description: teacherNotes(scenario.description, shown),
				events: shown ? scenario.events : null,
				atctrainer: shown ? scenario.atctrainer : null
			}))
		}
	};
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

/**
 * The catalogue's positions, for Centerline's `Position` to look scenario positions up in
 * (decision 0060). When the CMS cannot be read and no copy is kept, there are none, as
 * Centerline's positions lookup asks: every position is then shown by its id, and the page
 * still renders.
 */
export async function cataloguePositions(locals: App.Locals): Promise<PublicPosition[]> {
	return (await catalogueOrEmpty(locals)).positions;
}

/**
 * The catalogue, for a page that can do without it: when the CMS cannot be read and no copy is
 * kept, an empty one, so the page still renders (positions by their ids, no citations, areas by
 * their numbers). The same read as the layout's positions: the CMS client reads it once a request.
 */
export async function catalogueOrEmpty(locals: App.Locals): Promise<Catalogue> {
	try {
		return await locals.cms.catalogue();
	} catch (err) {
		if (err instanceof CmsUnavailableError) {
			console.error('[indy-library] no catalogue:', err);
			return {
				frameworks: [],
				competencies: [],
				sources: [],
				credentials: [],
				positions: [],
				tasks: []
			};
		}
		throw err;
	}
}

/**
 * Makes the function that turns a scenario's position, a vNAS id, into what the page shows: the
 * callsign and whether it is retired, from the catalogue's positions. An id the catalogue lacks
 * (the two documents are kept apart, so it can happen) is shown by its id, not retired.
 */
export async function makeShownPosition(
	locals: App.Locals
): Promise<(positionId: string) => ShownPosition> {
	const byId = new Map((await cataloguePositions(locals)).map((p) => [p.id, p]));
	return (id) => {
		const position = byId.get(id);
		return { id, callsign: position?.callsign ?? id, retired: position?.retired ?? false };
	};
}

/** A task as a link to its page shows it. */
export function taskRef(task: TaskRef): TaskRef {
	return { id: task.id, number: task.number, name: task.name };
}
