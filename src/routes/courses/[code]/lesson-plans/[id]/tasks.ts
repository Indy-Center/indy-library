import type { Catalogue } from '$lib/server/cms/types';
import type { SentLessonPlan } from '$lib/server/reader';

/**
 * A lesson plan's tasks as its page lays them out (decision 0076): grouped by the top of the
 * task tree, a statement-less task with its descendants here standing as a heading over them.
 */

type SentTask = SentLessonPlan['tasks'][number];

/** A citation as the page shows it: the source's name (null when the catalogue lacks it). */
export type ShownCitation = { source: string | null; text: string; url: string | null };

/** What a task row shows beneath its name, in the second column. */
export type TaskDetail = {
	knowledge: string;
	skill: string;
	citations: ShownCitation[];
	teacherNotes: string | null;
};

export type TaskRow = TaskDetail & {
	kind: 'task';
	id: string;
	number: string;
	name: string;
	optional: boolean;
};

export type TaskHeading = {
	kind: 'heading';
	id: string;
	number: string;
	name: string;
	teacherNotes: string | null;
	rows: TaskNode[];
};

export type TaskNode = TaskRow | TaskHeading;

export type TaskArea = {
	/** The top-level task number, such as `2`. */
	number: string;
	/** The catalogue's top-level task's name, or null when the catalogue lacks it. */
	name: string | null;
	/** The rows drawn as tasks, at every depth. */
	count: number;
	/** The top-level task's own row, when the lesson plan has one with something to show. */
	lead: TaskDetail | null;
	rows: TaskNode[];
};

export type LessonPlanTasks = {
	/** Rows drawn as tasks: headings and top-level rows are not counted. */
	count: number;
	optional: number;
	areas: TaskArea[];
};

const topOf = (number: string) => number.split('.')[0];
const isBelow = (number: string, above: string) => number.startsWith(`${above}.`);
const hasStatements = (task: SentTask) =>
	task.statements.knowledge.trim() !== '' || task.statements.skill.trim() !== '';

export function lessonPlanTasks(
	tasks: SentTask[],
	catalogue: Pick<Catalogue, 'tasks' | 'sources'>
): LessonPlanTasks {
	const byId = new Map(catalogue.tasks.map((t) => [t.id, t]));
	const byNumber = new Map(catalogue.tasks.map((t) => [t.number, t]));
	const sources = new Map(catalogue.sources.map((s) => [s.id, s]));

	// From the catalogue's task: the source's name, then the title or else the place; the
	// citation's own link, else its source's, else none. A source the catalogue lacks: no link.
	function citations(taskId: string): ShownCitation[] {
		return (byId.get(taskId)?.citations ?? []).map((c) => {
			const source = sources.get(c.sourceId);
			return {
				source: source?.name ?? null,
				text: c.title ?? c.place,
				url: source ? c.url || source.url || null : null
			};
		});
	}

	function detail(task: SentTask): TaskDetail {
		return {
			knowledge: task.statements.knowledge,
			skill: task.statements.skill,
			citations: citations(task.task.id),
			teacherNotes: task.teacherNotes
		};
	}

	const isHeading = (task: SentTask) =>
		!hasStatements(task) && tasks.some((t) => isBelow(t.task.number, task.task.number));

	const areas: (TaskArea & { below: SentTask[] })[] = [];
	for (const task of tasks) {
		const number = topOf(task.task.number);
		let area = areas.find((a) => a.number === number);
		if (!area) {
			area = {
				number,
				name: byNumber.get(number)?.name ?? null,
				count: 0,
				lead: null,
				rows: [],
				below: []
			};
			areas.push(area);
		}
		if (task.task.number !== number) area.below.push(task);
		else if (hasStatements(task) || task.teacherNotes) area.lead ??= detail(task);
	}

	let count = 0;
	let optional = 0;
	const result = areas.map(({ below, ...area }) => {
		// Lesson order; a heading takes the rows after it that sit beneath it in the tree.
		const stack: TaskHeading[] = [];
		for (const task of below) {
			while (stack.length && !isBelow(task.task.number, stack[stack.length - 1].number)) {
				stack.pop();
			}
			const into = stack.length ? stack[stack.length - 1].rows : area.rows;
			const ref = { id: task.id, number: task.task.number, name: task.task.name };
			if (isHeading(task)) {
				const heading: TaskHeading = {
					kind: 'heading',
					...ref,
					teacherNotes: task.teacherNotes,
					rows: []
				};
				into.push(heading);
				stack.push(heading);
			} else {
				into.push({ kind: 'task', ...ref, optional: !task.required, ...detail(task) });
				area.count++;
				count++;
				if (!task.required) optional++;
			}
		}
		return area;
	});

	return { count, optional, areas: result };
}
