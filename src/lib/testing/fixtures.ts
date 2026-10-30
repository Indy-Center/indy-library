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
	studentPosition: { id: 'pos-xmp-gnd', callsign: 'XMP_GND' },
	teacherPosition: { id: 'pos-xmp-twr', callsign: 'XMP_TWR' },
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
	completionStandard: 'Pass every lesson plan.',
	updatedAt: '2026-10-01T12:00:00.000Z'
};

/** A course that asks nothing before enrolling and says nothing of how long it runs. */
const noFacts = {
	prerequisitesNote: '',
	consolidation: null,
	ratingExam: null,
	academyExam: null,
	estimatedWeeks: null,
	moodleUrl: null,
	prerequisites: [],
	credentialIssued: null
};

export const sgcCurrent: CourseVersionDocument = {
	course: {
		id: 'course-sgc',
		code: 'S-GC',
		title: 'Ground Control',
		authors: [AUTHOR_CID],
		prerequisitesNote: 'Read the made-up policy first.',
		consolidation: { hours: 10, positionTypes: ['DEL', 'GND'] },
		ratingExam: 'S1',
		academyExam: 'S2',
		estimatedWeeks: { min: 4, max: 8 },
		moodleUrl: 'https://moodle.example.com/course/1',
		// Ticket 07: two rows. The first is "one of two" (the second is retired); the second row's
		// code is not in the catalogue.
		prerequisites: [{ anyOf: ['X-OBS', 'X-OLD'] }, { anyOf: ['X-GONE'] }],
		credentialIssued: 'S-GC'
	},
	// Ticket 08: a standard of two lines.
	version: {
		id: 'ver-sgc-1',
		number: 1,
		...version,
		completionStandard: 'Pass every lesson plan.\nThen sit the made-up review.'
	},
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

// Scenario cases for the scenario page's browser check (ticket 10): a retired one, and one
// with no difficulty. Only S-GC's draft offers them, so no published-version page changes.
const retiredScenario: Scenario = {
	...quietAfternoon,
	id: 'scn-retired',
	name: 'An old evening at Example Field',
	difficulty: 'hard',
	mode: 'live',
	retired: true
};

const unratedScenario: Scenario = {
	...quietAfternoon,
	id: 'scn-unrated',
	name: 'A foggy morning at Example Field',
	difficulty: null
};

/** S-GC's next version, being written. */
export const sgcDraft: CourseVersionDocument = {
	...sgcCurrent,
	version: {
		...sgcCurrent.version,
		id: 'ver-sgc-2',
		number: 2,
		status: 'draft',
		// Ticket 08: differs from the current edition's.
		completionStandard: 'Pass every lesson plan, rewritten.'
	},
	modules: [
		{
			...sgcCurrent.modules[0],
			lessonPlans: [
				{
					...taxiBasics,
					title: 'Taxi basics, rewritten',
					scenarios: [quietAfternoon, retiredScenario, unratedScenario]
				}
			]
		}
	]
};

export const alcCurrent: CourseVersionDocument = {
	course: { id: 'course-alc', code: 'A-LC', title: 'Local Control', authors: [], ...noFacts },
	version: {
		id: 'ver-alc-1',
		number: 1,
		...version,
		description: 'The made-up tower course.',
		// Ticket 08: blank, so the page shows no completion standard.
		completionStandard: ''
	},
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
	course: {
		id: 'course-xnew',
		code: 'X-NEW',
		title: 'Unreleased Course',
		authors: [AUTHOR_CID],
		...noFacts,
		// Ticket 08: equal minimum and maximum weeks.
		estimatedWeeks: { min: 6, max: 6 }
	},
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
	credentials: [
		{
			id: 'cred-sgc',
			code: 'S-GC',
			kind: 'certification',
			name: 'Made-up ground certification',
			description: 'Works the ground at made-up fields.',
			rank: 1,
			grantedOnArrival: ['S1'],
			retired: false
		},
		{
			id: 'cred-xobs',
			code: 'X-OBS',
			kind: 'endorsement',
			name: 'Made-up observer endorsement',
			description: 'Has watched a session.',
			rank: null,
			grantedOnArrival: [],
			retired: false
		},
		// Ticket 07: a retired credential.
		{
			id: 'cred-xold',
			code: 'X-OLD',
			kind: 'endorsement',
			name: 'Made-up retired endorsement',
			description: 'No longer issued.',
			rank: null,
			grantedOnArrival: [],
			retired: true
		}
	],
	positions: [
		{
			id: 'pos-xmp-gnd',
			callsign: 'XMP_GND',
			name: 'Example Ground',
			shortName: 'XMP GND',
			radioName: 'Example Ground',
			frequency: 121900000,
			facility: { id: 'XMP', name: 'Example Field ATCT' },
			starred: true,
			requiredCredentials: [{ anyOf: ['S-GC'] }],
			retired: false
		},
		{
			id: 'pos-xmp-twr',
			callsign: 'XMP_TWR',
			name: 'Example Tower',
			shortName: null,
			radioName: 'Example Tower',
			frequency: 118300000,
			facility: { id: 'XMP', name: 'Example Field ATCT' },
			starred: true,
			requiredCredentials: [],
			retired: false
		}
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
			citations: [{ sourceId: 'source-order', place: '3-7-2', title: 'Taxi and ground movement' }]
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
			citations: [{ sourceId: 'source-notes', place: 'Chapter 4', title: null }]
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
		},
		// Task page cases (library-centerline 12). Nothing here is mapped, so the competency
		// pages' lists are unchanged. `task-readback` gives the browser check ancestors, a child
		// (task-cited) and inherited mappings; `task-cited` has three citations: with a title,
		// without one, and with a blank place.
		{
			id: 'task-cited',
			number: '1.1.1.1',
			name: 'Confirm the hold short',
			description: 'Line one of the description.\nLine two, after a break.',
			parentId: 'task-readback',
			retired: false,
			mappings: [],
			citations: [
				{ sourceId: 'source-order', place: '3-7-2', title: 'Taxi and ground movement' },
				{ sourceId: 'source-notes', place: 'Chapter 4', title: null },
				{ sourceId: 'source-order', place: '', title: 'Whole-document overview' }
			]
		},
		{
			id: 'task-retired',
			number: '3',
			name: 'Issue a paper strip',
			description: '',
			parentId: null,
			retired: true,
			mappings: [],
			citations: []
		},
		// Competency page case (library-centerline 14): a retired task that teaches
		// `comp-gcap-move` (the others there are live), for the "Retired" badge.
		{
			id: 'task-retired-strip',
			number: '4',
			name: 'Mark a flight strip',
			description: '',
			parentId: null,
			retired: true,
			mappings: [{ competencyId: 'comp-gcap-move', fromTaskId: 'task-retired-strip' }],
			citations: []
		}
	]
};
