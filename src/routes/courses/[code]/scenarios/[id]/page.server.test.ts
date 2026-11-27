import { describe, expect, it } from 'vitest';
import type { SessionContext } from '@indy-center/identity';
import { cmsDocuments, fakeCms, fakeTraining, library, run } from '$lib/testing/library';
import { session } from '$lib/testing/readers';
import { AUTHOR_CID } from '$lib/testing/fixtures';
import { load } from './+page.server';

const student = session('1000002');
const teacher = session('1000005');
const admin = session('1000003', ['training:admin']);

function scenario(
	lib: ReturnType<typeof library>,
	id: string,
	code = 'S-GC',
	reader: SessionContext = student
) {
	return run(load, lib.event(reader, `/courses/${code}/scenarios/${id}`, { code, id }));
}

describe('/courses/[code]/scenarios/[id]', () => {
	it('shows a student the airport and their position, and not the teacher position', async () => {
		const data = await scenario(library(), 'scn-quiet');

		expect(data.course).toEqual({ code: 'S-GC', title: 'Ground Control' });
		expect(data.scenario).toEqual({
			id: 'scn-quiet',
			name: 'A quiet afternoon at Example Field',
			airport: 'KXMP',
			studentPosition: { id: 'pos-xmp-gnd', callsign: 'XMP_GND', retired: false },
			teacherPosition: null,
			retired: false
		});
	});

	it('shows a teacher of the course the teacher position', async () => {
		const lib = library({ training: fakeTraining({ '1000005': ['S-GC'] }) });
		const params = { code: 'S-GC', id: 'scn-quiet' };
		const data = await run(load, lib.event(teacher, '/courses/S-GC/scenarios/scn-quiet', params));

		expect(data.showsTeacherNotes).toBe(true);
		expect(data.scenario.teacherPosition).toEqual({
			id: 'pos-xmp-twr',
			callsign: 'XMP_TWR',
			retired: false
		});
	});

	describe('positions, each by its vNAS id and catalogue callsign for Position, and whether it is retired', () => {
		it('hands over a position with a short name, and one without, as not retired', async () => {
			// XMP_GND has a short name in the catalogue; XMP_TWR has none.
			const data = await scenario(library(), 'scn-tower-day', 'A-LC', admin);

			expect(data.scenario.studentPosition).toEqual({
				id: 'pos-xmp-twr',
				callsign: 'XMP_TWR',
				retired: false
			});
			expect(data.scenario.teacherPosition).toEqual({
				id: 'pos-xmp-gnd',
				callsign: 'XMP_GND',
				retired: false
			});
		});

		it('marks a position the catalogue has retired', async () => {
			const data = await scenario(library(), 'scn-old-delivery', 'A-LC');

			expect(data.scenario.studentPosition).toEqual({
				id: 'pos-xmp-del',
				callsign: 'XMP_DEL',
				retired: true
			});
		});

		it('hands over a position the catalogue lacks by its id, not retired', async () => {
			const data = await scenario(library(), 'scn-lost-position', 'A-LC', admin);

			expect(data.scenario.studentPosition).toEqual({
				id: 'pos-xmp-app',
				callsign: 'pos-xmp-app',
				retired: false
			});
			expect(data.scenario.teacherPosition).toEqual({
				id: 'pos-xmp-del',
				callsign: 'XMP_DEL',
				retired: true
			});
		});

		it('still shows the scenario when the catalogue cannot be read, by id with nothing retired', async () => {
			const documents = cmsDocuments();
			delete documents['/api/courseware/catalogue'];
			const data = await scenario(library({ cms: fakeCms(documents) }), 'scn-old-delivery', 'A-LC');

			expect(data.scenario.studentPosition).toEqual({
				id: 'pos-xmp-del',
				callsign: 'pos-xmp-del',
				retired: false
			});
		});
	});

	it('names the lesson plans that offer it', async () => {
		const data = await scenario(library(), 'scn-quiet');

		expect(data.offeredBy).toEqual([{ id: 'lp-taxi', code: 'S-GC-1', title: 'Taxi basics' }]);
	});

	it('sends a student none of the teacher-only material', async () => {
		const data = await scenario(library(), 'scn-quiet');

		expect(JSON.stringify(data)).not.toContain('SECRET');
		expect(JSON.stringify(data)).not.toContain('XMP_TWR');
	});

	it('is a 404 for a scenario the current version does not offer', async () => {
		await expect(scenario(library(), 'scn-quiet', 'A-LC')).rejects.toMatchObject({
			status: 404
		});
	});

	it("shows a draft's scenario to the course's authors, and nobody else", async () => {
		const href = '/courses/S-GC/scenarios/scn-quiet?version=draft';
		const params = { code: 'S-GC', id: 'scn-quiet' };

		const data = await run(load, library().event(session(AUTHOR_CID), href, params));
		expect(data.version).toEqual({ number: 2, isDraft: true });
		expect(data.offeredBy).toEqual([
			{ id: 'lp-taxi', code: 'S-GC-1', title: 'Taxi basics, rewritten' }
		]);

		await expect(run(load, library().event(student, href, params))).rejects.toMatchObject({
			status: 404
		});
	});
});
