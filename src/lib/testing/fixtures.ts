import type {
	Catalogue,
	CourseList,
	CourseVersionDocument,
	LessonPlan,
	Scenario
} from '$lib/server/cms/types';

/**
 * What the CMS serves, shaped exactly like the contract in `$lib/server/cms/types`. Typed against
 * it, so a change to the contract that the fixtures do not follow fails `pnpm check`.
 *
 * Every word of content here is made up. The repository is public: never paste real courseware
 * or VATUSA's wording into a fixture.
 */

/** Named on S-GC and X-NEW as an author. */
export const AUTHOR_CID = '1000001';

export const POINTS = [
	{ position: 1, label: 'Unsatisfactory', description: 'Needs the teacher throughout.' },
	{ position: 2, label: 'Satisfactory', description: 'Needs the teacher now and then.' },
	{ position: 3, label: 'Excellent', description: 'Needs no help.' }
];

const quietAfternoon: Scenario = {
	id: 'scn-quiet',
	name: 'A quiet afternoon at Example Field',
	airport: 'KXMP',
	studentPosition: 'XMP_GND',
	teacherPosition: null,
	difficulty: 'easy',
	mode: 'sim',
	retired: false,
	practicalTasks: [
		{
			id: 'pt-1',
			task: { id: 'task-taxi-clearance', number: '1.1', name: 'Issue a taxi clearance' },
			teacherNotes: 'SECRET-PT-1: have the pilot read back the wrong runway.',
			required: true
		},
		{
			id: 'pt-2',
			task: { id: 'task-progressive', number: '1.2', name: 'Give progressive taxi' },
			teacherNotes: 'SECRET-PT-2: pilot asks for progressive taxi halfway.',
			required: false
		}
	]
};

const taxiBasics: LessonPlan = {
	id: 'lp-taxi',
	code: 'S-GC-1',
	title: 'Taxi basics',
	description: 'Moving aircraft around a made-up field.',
	bodyHtml: '<p>Read the field diagram of Example Field before the lesson.</p>',
	time: 90,
	isExam: false,
	minimum: POINTS[1],
	theoryItems: [
		{
			id: 'ti-1',
			task: { id: 'task-taxi-clearance', number: '1.1', name: 'Issue a taxi clearance' },
			teacherNotes: 'SECRET-TI-1: ask what "hold short" means.'
		},
		{
			id: 'ti-2',
			task: { id: 'task-progressive', number: '1.2', name: 'Give progressive taxi' },
			teacherNotes: ''
		}
	],
	scenarios: [quietAfternoon]
};

/** A lesson plan with no teacher notes anywhere, so there is nothing to decide. */
const groundReview: LessonPlan = {
	id: 'lp-review',
	code: 'S-GC-2',
	title: 'Ground review',
	description: 'Talking it all through.',
	bodyHtml: '<p>No reading needed.</p>',
	time: null,
	isExam: true,
	minimum: null,
	theoryItems: [
		{
			id: 'ti-3',
			task: { id: 'task-ground', number: '1', name: 'Ground movement' },
			teacherNotes: ''
		}
	],
	scenarios: []
};

const version = {
	status: 'published' as const,
	description: 'The made-up ground control course.',
	time: 600,
	academyRequired: true,
	updatedAt: '2026-10-01T12:00:00.000Z'
};

export const sgcCurrent: CourseVersionDocument = {
	course: { id: 'course-sgc', code: 'S-GC', title: 'Ground Control', authors: [AUTHOR_CID] },
	version: { id: 'ver-sgc-1', number: 1, ...version },
	scale: { id: 'scale-1', name: 'Three points', points: POINTS },
	defaultMinimum: POINTS[1],
	modules: [
		{
			id: 'mod-ground',
			title: 'Ground control',
			description: 'Everything on the ground.',
			lessonPlans: [taxiBasics, groundReview]
		}
	]
};

/** S-GC's next version, being written. */
export const sgcDraft: CourseVersionDocument = {
	...sgcCurrent,
	version: { ...sgcCurrent.version, id: 'ver-sgc-2', number: 2, status: 'draft' },
	modules: [
		{
			...sgcCurrent.modules[0],
			lessonPlans: [{ ...taxiBasics, title: 'Taxi basics, rewritten' }]
		}
	]
};

export const alcCurrent: CourseVersionDocument = {
	course: { id: 'course-alc', code: 'A-LC', title: 'Local Control', authors: [] },
	version: { id: 'ver-alc-1', number: 1, ...version, description: 'The made-up tower course.' },
	scale: { id: 'scale-1', name: 'Three points', points: POINTS },
	defaultMinimum: POINTS[1],
	modules: [
		{
			id: 'mod-tower',
			title: 'Tower',
			description: 'Runways.',
			lessonPlans: [
				{
					id: 'lp-runway',
					code: 'A-LC-1',
					title: 'Runway basics',
					description: 'One runway at a time.',
					bodyHtml: '<p>Runways are long.</p>',
					time: 60,
					isExam: false,
					minimum: POINTS[1],
					theoryItems: [
						{
							id: 'ti-alc',
							task: { id: 'task-ground', number: '1', name: 'Ground movement' },
							teacherNotes: 'SECRET-ALC: ask about runway crossings.'
						}
					],
					scenarios: []
				}
			]
		}
	]
};

/** X-NEW has only a draft. */
export const xnewDraft: CourseVersionDocument = {
	course: { id: 'course-xnew', code: 'X-NEW', title: 'Unreleased Course', authors: [AUTHOR_CID] },
	version: { id: 'ver-xnew-1', number: 1, ...version, status: 'draft' },
	scale: null,
	defaultMinimum: null,
	modules: []
};

export const courseList: CourseList = {
	courses: [
		{
			id: 'course-sgc',
			code: 'S-GC',
			title: 'Ground Control',
			authors: [AUTHOR_CID],
			currentVersion: { id: 'ver-sgc-1', number: 1 },
			draftVersion: { id: 'ver-sgc-2', number: 2 }
		},
		{
			id: 'course-alc',
			code: 'A-LC',
			title: 'Local Control',
			authors: [],
			currentVersion: { id: 'ver-alc-1', number: 1 },
			draftVersion: null
		},
		{
			id: 'course-xnew',
			code: 'X-NEW',
			title: 'Unreleased Course',
			authors: [AUTHOR_CID],
			currentVersion: null,
			draftVersion: { id: 'ver-xnew-1', number: 1 }
		}
	]
};

export const catalogue: Catalogue = {
	frameworks: [
		{ id: 'fw-usa', name: 'USA', edition: 'Example edition 1' },
		{ id: 'fw-gcap', name: 'GCAP', edition: 'Example edition 2' }
	],
	competencies: [
		{
			id: 'comp-heading',
			frameworkId: 'fw-usa',
			sourceId: '1',
			title: 'Ground operations',
			text: '',
			parentId: null,
			sourceReference: '',
			rubricTheory: '',
			rubricPractical: '',
			pairedGcapCode: ''
		},
		{
			id: 'comp-usa-taxi',
			frameworkId: 'fw-usa',
			sourceId: '1.1',
			title: 'Taxi instructions',
			text: 'Issues clear, correct taxi instructions.',
			parentId: 'comp-heading',
			sourceReference: 'Example Order 1-2-3',
			rubricTheory: 'Explains each part of a taxi instruction.',
			rubricPractical: 'Issues taxi instructions without prompting.',
			pairedGcapCode: 'G-9.9'
		},
		{
			id: 'comp-gcap-move',
			frameworkId: 'fw-gcap',
			sourceId: 'G-9.9',
			title: 'Movement area',
			text: 'Controls movement on the ground.',
			parentId: null,
			sourceReference: '',
			rubricTheory: '',
			rubricPractical: '',
			pairedGcapCode: ''
		}
	],
	sources: [
		{ id: 'source-order', name: 'Example Order', edition: 'B', url: 'https://example.com/order' },
		{ id: 'source-notes', name: 'Example Notes', edition: '2', url: 'https://example.com/notes' }
	],
	tasks: [
		{
			id: 'task-ground',
			number: '1',
			name: 'Ground movement',
			description: 'Anything that moves on the ground.',
			parentId: null,
			retired: false,
			mappings: [{ competencyId: 'comp-usa-taxi', fromTaskId: 'task-ground' }],
			citations: [{ sourceId: 'source-order', section: '3-7-2' }]
		},
		{
			id: 'task-taxi-clearance',
			number: '1.1',
			name: 'Issue a taxi clearance',
			description: 'Route, hold short, readback.',
			parentId: 'task-ground',
			retired: false,
			mappings: [
				{ competencyId: 'comp-usa-taxi', fromTaskId: 'task-ground' },
				{ competencyId: 'comp-gcap-move', fromTaskId: 'task-taxi-clearance' }
			],
			citations: [{ sourceId: 'source-notes', section: 'Chapter 4' }]
		},
		{
			id: 'task-readback',
			number: '1.1.1',
			name: 'Check the readback',
			description: 'Listen for the hold short.',
			parentId: 'task-taxi-clearance',
			retired: false,
			mappings: [
				{ competencyId: 'comp-usa-taxi', fromTaskId: 'task-ground' },
				{ competencyId: 'comp-gcap-move', fromTaskId: 'task-taxi-clearance' }
			],
			citations: []
		},
		{
			id: 'task-progressive',
			number: '1.2',
			name: 'Give progressive taxi',
			description: 'Turn by turn.',
			parentId: 'task-ground',
			retired: false,
			mappings: [{ competencyId: 'comp-usa-taxi', fromTaskId: 'task-ground' }],
			citations: []
		},
		{
			id: 'task-unmapped',
			number: '2',
			name: 'Coordination',
			description: 'Talking to the next position.',
			parentId: null,
			retired: false,
			mappings: [],
			citations: []
		}
	]
};
