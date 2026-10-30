import type {
	Catalogue,
	Competency,
	CourseVersionDocument,
	LessonPlan
} from '$lib/server/cms/types';
import { POINTS, alcCurrent, catalogue } from './fixtures';
import { cmsDocuments } from './library';

/**
 * Extra cases for the dev preview only, laid over the test fixtures. The fixtures are pinned by
 * load tests (the course list, the editions), so states they cannot hold live here instead.
 *
 * Imported only by `./preview`, never by a test, and so reachable only under
 * `import.meta.env.DEV`. Every word is made up.
 */

/** The course that holds the lesson plan and scenario cases: `/courses/P-CASES`. */
export const CASES_CODE = 'P-CASES';

/** Framework edition ids: `/competencies?edition=<id>`. */
export const EMPTY_EDITION = 'fw-preview-empty';
export const DEEP_EDITION = 'fw-preview-deep';

// A tiny SVG, inline, so the preview shows an image with no network.
const DIAGRAM =
	'data:image/svg+xml;utf8,' +
	encodeURIComponent(
		'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120"><rect width="320" height="120" fill="#888"/><text x="12" y="64">Example Field diagram</text></svg>'
	);

/** A lesson plan whose body has headings, lists, a link and an image. */
const richBody: LessonPlan = {
	id: 'lp-preview-rich',
	code: 'P-CASES-1',
	title: 'A lesson with a long body',
	description: 'Headings, lists, a link and an image.',
	bodyHtml: [
		'<h2>Before the lesson</h2>',
		'<p>Read the <a href="https://example.com/field-guide">Example Field guide</a> first.</p>',
		'<ul><li>Bring the field diagram.</li><li>Know the three taxiways.</li></ul>',
		'<h3>Order of work</h3>',
		'<ol><li>Walk the airfield.</li><li>Issue a clearance.</li><li>Read it back.</li></ol>',
		`<p><img src="${DIAGRAM}" alt="A made-up field diagram" /></p>`,
		'<h3>Afterwards</h3>',
		'<p>Write down one thing that surprised you.</p>'
	].join(''),
	time: 45,
	isExam: false,
	minimum: POINTS[1],
	theoryItems: [],
	// Scenario with no practical tasks (see also A-LC's "A busy day in Example Tower").
	scenarios: alcCurrent.modules[0].lessonPlans[0].scenarios.slice(0, 1)
};

const casesCurrent: CourseVersionDocument = {
	...alcCurrent,
	course: { ...alcCurrent.course, id: 'course-preview', code: CASES_CODE, title: 'Preview Cases' },
	version: { ...alcCurrent.version, id: 'ver-preview-1' },
	modules: [
		{
			id: 'mod-preview',
			title: 'Cases',
			description: 'States the test fixtures do not hold.',
			lessonPlans: [richBody]
		}
	]
};

function competency(
	id: string,
	sourceId: string,
	title: string,
	text: string,
	parentId: string | null,
	rubric = ''
): Competency {
	return {
		id,
		frameworkId: DEEP_EDITION,
		sourceId,
		title,
		text,
		parentId,
		sourceReference: '',
		rubricTheory: rubric,
		rubricPractical: rubric,
		pairedGcapCode: ''
	};
}

const deepCompetencies: Competency[] = [
	competency('comp-deep-1', '1', 'Airfield work', '', null),
	competency('comp-deep-1-1', '1.1', 'Movement', '', 'comp-deep-1'),
	competency(
		'comp-deep-1-1-1',
		'1.1.1',
		'Crossing a runway',
		'Crosses a runway only when cleared.\nChecks both ends before every crossing.\nSays what was cleared, every time.',
		'comp-deep-1-1',
		'Names each step of a crossing.\nExplains why a crossing is never assumed.\nDescribes what to do when a readback is wrong.'
	)
];

const previewCatalogue: Catalogue = {
	...catalogue,
	frameworks: [
		...catalogue.frameworks,
		{ id: EMPTY_EDITION, name: 'Empty', edition: 'Example edition with nothing in it' },
		{ id: DEEP_EDITION, name: 'Deep', edition: 'Example edition, three levels' }
	],
	competencies: [...catalogue.competencies, ...deepCompetencies]
};

/** The fixtures' CMS documents with the preview's cases added. */
export function previewDocuments(): Record<string, unknown> {
	// The course list stays as the fixtures have it (a load test pins it): P-CASES is reached by
	// its address, `/courses/P-CASES`, and is not listed.
	return {
		...cmsDocuments(),
		[`/api/courseware/courses/${CASES_CODE}/current`]: casesCurrent,
		'/api/courseware/catalogue': previewCatalogue
	};
}
