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

/** A point's description leads with its short name, before a colon, as the CMS's scales do. */
export const POINTS = [
	{ position: 1, label: '1', description: 'Unsatisfactory: needs the teacher throughout.' },
	{ position: 2, label: '2', description: 'Satisfactory: needs the teacher now and then.' },
	{ position: 3, label: '3', description: 'Excellent: needs no help.' }
];

/**
 * Every teacher-only field is set here (decision 0076): a description, events, an ATCTrainer id
 * and a teacher position.
 */
const quietAfternoon: Scenario = {
	id: 'scn-quiet',
	name: 'A quiet afternoon at Example Field',
	airport: 'KXMP',
	studentPosition: 'pos-xmp-gnd',
	teacherPosition: 'pos-xmp-twr',
	description: 'SECRET-SCN-1: start with one departure.\nAdd arrivals as the student settles.',
	// In the scenario's order, which is not difficulty order. The last has no callsign or type.
	events: [
		{
			id: 'evt-1',
			difficulty: 'easy',
			callsign: 'XMP101',
			aircraftType: 'C172',
			description: 'SECRET-EVT-1: asks for taxi without the ATIS.'
		},
		{
			id: 'evt-2',
			difficulty: 'medium',
			callsign: 'XMP202',
			aircraftType: 'B738',
			description: 'SECRET-EVT-2: misses the hold short and needs a correction.'
		},
		{
			id: 'evt-3',
			difficulty: 'easy',
			callsign: '',
			aircraftType: '',
			description: 'SECRET-EVT-3: the ATIS changes mid-session.'
		}
	],
	// A link: an ATCTrainer value starting `https:`.
	atctrainer: 'https://example.com/atctrainer/SECRET-ATCTRAINER-QUIET',
	retired: false
};

/** A second scenario on the same lesson plan, its ATCTrainer value a file's ID, no events. */
const eveningPush: Scenario = {
	id: 'scn-evening',
	name: 'An evening push at Example Field',
	airport: 'KXMP',
	studentPosition: 'pos-xmp-gnd',
	teacherPosition: 'pos-xmp-del',
	description: '',
	events: [],
	atctrainer: 'SECRET-ATCTRAINER-ID-0042',
	retired: false
};

/**
 * A lesson plan with every teacher-only field set: a task's teacher notes, a teacher-only
 * resource, a resource's note and a scenario's teacher-only fields. Its tasks hold a heading
 * (no statements) above the tasks in it, an optional task, and a task with one statement.
 */
const taxiBasics: LessonPlan = {
	id: 'lp-taxi',
	code: 'S-GC-1',
	title: 'Taxi basics',
	description: 'Moving aircraft around a made-up field.',
	bodyHtml: '<p>Read the field diagram of Example Field before the lesson.</p>',
	body: {
		root: {
			type: 'root',
			children: [
				{
					type: 'paragraph',
					children: [
						{ type: 'text', text: 'Read the field diagram of Example Field before the lesson.' }
					]
				}
			]
		}
	},
	time: 90,
	isExam: false,
	minimum: POINTS[1],
	tasks: [
		{
			id: 'lpt-heading',
			task: { id: 'task-ground', number: '1', name: 'Ground movement' },
			required: true,
			statements: { knowledge: '', skill: '' },
			teacherNotes: ''
		},
		{
			id: 'lpt-1',
			task: { id: 'task-taxi-clearance', number: '1.1', name: 'Issue a taxi clearance' },
			required: true,
			statements: {
				knowledge: 'Knows the parts of a taxi clearance.',
				skill: 'Issues a taxi clearance with a route and a hold short.'
			},
			teacherNotes: 'SECRET-LPT-1: ask what "hold short" means.'
		},
		// No statements, and its child 1.1.1.1 is here: a heading over it.
		{
			id: 'lpt-readback',
			task: { id: 'task-readback', number: '1.1.1', name: 'Check the readback' },
			required: true,
			statements: { knowledge: '', skill: '' },
			teacherNotes: ''
		},
		{
			id: 'lpt-cited',
			task: { id: 'task-cited', number: '1.1.1.1', name: 'Confirm the hold short' },
			required: true,
			statements: { knowledge: 'Knows why a hold short is read back.', skill: '' },
			teacherNotes: ''
		},
		{
			id: 'lpt-2',
			task: { id: 'task-progressive', number: '1.2', name: 'Give progressive taxi' },
			required: false,
			statements: { knowledge: '', skill: 'Gives turn-by-turn taxi on request.' },
			teacherNotes: ''
		},
		// A task the catalogue lacks, in an area it lacks too (5), before area 2 in the lesson's
		// order. No statements and nothing beneath it here: an ordinary task.
		{
			id: 'lpt-uncatalogued',
			task: { id: 'task-uncatalogued', number: '5.1', name: 'Read the weather board' },
			required: true,
			statements: { knowledge: '', skill: '' },
			teacherNotes: ''
		},
		// A top-level task with statements: it is area 2's panel, its statements the first row.
		{
			id: 'lpt-coordination',
			task: { id: 'task-unmapped', number: '2', name: 'Coordination' },
			required: true,
			statements: { knowledge: 'Knows who to call before a crossing.', skill: '' },
			teacherNotes: ''
		}
	],
	resources: [
		{
			id: 'res-diagram',
			title: 'Example Field diagram',
			url: 'https://example.com/xmp-diagram',
			teacherOnly: false,
			note: 'SECRET-RES-NOTE: point out taxiway B first.'
		},
		{
			id: 'res-answers',
			title: 'SECRET-RES-ONLY: taxi quiz answers',
			url: 'https://example.com/secret-quiz-answers',
			teacherOnly: true,
			note: ''
		},
		{
			id: 'res-card',
			title: 'Example phraseology card',
			url: 'https://example.com/phraseology',
			teacherOnly: false,
			note: ''
		},
		{
			id: 'res-guide',
			title: 'SECRET-RES-ONLY-NOTED: teaching guide',
			url: 'https://example.com/secret-teaching-guide',
			teacherOnly: true,
			note: 'SECRET-RES-ONLY-NOTE: use the second half only.'
		}
	],
	scenarios: [quietAfternoon, eveningPush]
};

/** A lesson plan with nothing teacher-only anywhere, so there is nothing to decide. */
const groundReview: LessonPlan = {
	id: 'lp-review',
	code: 'S-GC-2',
	title: 'Ground review',
	description: 'Talking it all through.',
	bodyHtml: '<p>No reading needed.</p>',
	body: null,
	time: null,
	isExam: true,
	minimum: null,
	tasks: [
		{
			id: 'lpt-3',
			task: { id: 'task-ground', number: '1', name: 'Ground movement' },
			required: true,
			statements: { knowledge: 'Knows who owns which part of the field.', skill: '' },
			teacherNotes: ''
		}
	],
	resources: [
		{
			id: 'res-review',
			title: 'Example review sheet',
			url: 'https://example.com/review',
			teacherOnly: false,
			note: ''
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

// A retired scenario, still served. Only S-GC's draft offers it, so no published-version page
// changes.
const retiredScenario: Scenario = {
	...quietAfternoon,
	id: 'scn-retired',
	name: 'An old evening at Example Field',
	retired: true
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
					scenarios: [quietAfternoon, retiredScenario]
				}
			]
		}
	]
};

// Scenario position cases (library-centerline 11), offered by A-LC's published lesson plan so a
// student sees them. S-GC's `scn-quiet` already has a student position with a short name
// (XMP_GND). These add one without a short name (XMP_TWR), a retired one (XMP_DEL), and one
// the catalogue lacks (pos-xmp-app). No description, events or ATCTrainer id.
const towerDay: Scenario = {
	id: 'scn-tower-day',
	name: 'A busy day in Example Tower',
	airport: 'KXMP',
	studentPosition: 'pos-xmp-twr',
	teacherPosition: 'pos-xmp-gnd',
	description: '',
	events: [],
	atctrainer: null,
	retired: false
};

const oldDelivery: Scenario = {
	...towerDay,
	id: 'scn-old-delivery',
	name: 'Clearances from the old delivery desk',
	studentPosition: 'pos-xmp-del',
	teacherPosition: 'pos-xmp-twr'
};

const lostPosition: Scenario = {
	...towerDay,
	id: 'scn-lost-position',
	name: 'Arrivals from a missing approach',
	studentPosition: 'pos-xmp-app',
	teacherPosition: 'pos-xmp-del'
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
					body: null,
					time: 60,
					isExam: false,
					minimum: POINTS[1],
					tasks: [
						{
							id: 'lpt-alc',
							task: { id: 'task-ground', number: '1', name: 'Ground movement' },
							required: true,
							statements: { knowledge: 'Knows where the runways are.', skill: '' },
							teacherNotes: 'SECRET-ALC: ask about runway crossings.'
						}
					],
					resources: [],
					// Ticket 11's position cases.
					scenarios: [towerDay, oldDelivery, lostPosition]
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

const XMP_FACILITY = {
	id: 'XMP',
	name: 'Example Field ATCT',
	parent: { id: 'ZXM', name: 'Example Center' }
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
		{ id: 'source-notes', name: 'Example Notes', edition: '2', url: 'https://example.com/notes' },
		// A source with no link, so a citation of it links nowhere.
		{ id: 'source-paper', name: 'Example Handbook', edition: '1', url: '' }
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
			facility: XMP_FACILITY,
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
			facility: XMP_FACILITY,
			starred: true,
			requiredCredentials: [],
			retired: false
		},
		// Ticket 11: a position vNAS has dropped, kept and retired. No position `pos-xmp-app`
		// (XMP_APP) is here: a scenario names one the catalogue lacks.
		{
			id: 'pos-xmp-del',
			callsign: 'XMP_DEL',
			name: 'Example Delivery',
			shortName: 'XMP CD',
			radioName: 'Example Clearance',
			frequency: 121650000,
			facility: XMP_FACILITY,
			starred: false,
			requiredCredentials: [{ anyOf: ['S-GC'] }],
			retired: true
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
			knowledgeStatement: '',
			skillStatement: '',
			mappings: [{ competencyId: 'comp-usa-taxi', fromTaskId: 'task-ground' }],
			citations: [
				{ sourceId: 'source-order', place: '3-7-2', title: 'Taxi and ground movement', url: null }
			]
		},
		{
			id: 'task-taxi-clearance',
			number: '1.1',
			name: 'Issue a taxi clearance',
			description: 'Route, hold short, readback.',
			parentId: 'task-ground',
			retired: false,
			knowledgeStatement: 'Knows the parts of a taxi clearance.',
			skillStatement: 'Issues a taxi clearance with a route and a hold short.',
			mappings: [
				{ competencyId: 'comp-usa-taxi', fromTaskId: 'task-ground' },
				{ competencyId: 'comp-gcap-move', fromTaskId: 'task-taxi-clearance' }
			],
			// A citation with its own link; the others have none and fall back to their source's.
			citations: [
				{
					sourceId: 'source-notes',
					place: 'Chapter 4',
					title: null,
					url: 'https://example.com/notes#chapter-4'
				}
			]
		},
		{
			id: 'task-readback',
			number: '1.1.1',
			name: 'Check the readback',
			description: 'Listen for the hold short.',
			parentId: 'task-taxi-clearance',
			retired: false,
			knowledgeStatement: '',
			skillStatement: '',
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
			knowledgeStatement: '',
			skillStatement: '',
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
			knowledgeStatement: '',
			skillStatement: '',
			mappings: [],
			// Lesson plan citation cases: a source with no link, and a source the catalogue lacks.
			citations: [
				{ sourceId: 'source-paper', place: 'Section 2', title: null, url: null },
				{ sourceId: 'source-gone', place: '7-1', title: 'Calling the next position', url: null }
			]
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
			knowledgeStatement: '',
			skillStatement: '',
			mappings: [],
			citations: [
				{ sourceId: 'source-order', place: '3-7-2', title: 'Taxi and ground movement', url: null },
				{ sourceId: 'source-notes', place: 'Chapter 4', title: null, url: null },
				{ sourceId: 'source-order', place: '', title: 'Whole-document overview', url: null }
			]
		},
		{
			id: 'task-retired',
			number: '3',
			name: 'Issue a paper strip',
			description: '',
			parentId: null,
			retired: true,
			knowledgeStatement: '',
			skillStatement: '',
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
			knowledgeStatement: '',
			skillStatement: '',
			mappings: [{ competencyId: 'comp-gcap-move', fromTaskId: 'task-retired-strip' }],
			citations: []
		}
	]
};
