import { describe, expect, it } from 'vitest';
// @ts-expect-error a plain ESM script with no types
import { checkSource } from './check-style.mjs';

const check = checkSource as (file: string, text: string) => { line: number; message: string }[];

const lines = (text: string, file = 'a.svelte') => check(file, text).map((p) => p.line);

describe('palette colour classes', () => {
	it('passes Centerline role classes and a Badge variant prop', () => {
		const ok =
			'<div class="bg-muted text-foreground-soft outline-ring"><Badge variant="gray" /></div>';
		expect(check('a.svelte', ok)).toEqual([]);
	});

	it('fails a palette class under any variant, with its line', () => {
		const bad = '<p>\n<div class="p-2 dark:hover:bg-red-500 text-white/50"></div>\n</p>';
		expect(lines(bad)).toEqual([2, 2]);
		expect(lines('const c = "border-sky-300";', 'a.ts')).toEqual([1]);
	});
});

describe('colour literals', () => {
	it('passes tokens, anchors and TypeScript', () => {
		expect(check('a.css', 'a { color: var(--color-muted); }')).toEqual([]);
		expect(check('a.svelte', '<a href="#top">Top</a> <a href="#add">Add</a>')).toEqual([]);
		expect(check('a.ts', "const c = '#ff0000';")).toEqual([]);
	});

	it('fails hex, rgb, rgba and hsl in .svelte and .css', () => {
		expect(lines('a { color: #fff; }', 'a.css')).toEqual([1]);
		expect(lines('<style>\na { color: rgb(1 2 3); }\n</style>')).toEqual([2]);
		expect(
			lines('x { background: hsl(0 0% 0%); border: 1px solid rgba(0,0,0,.5) }', 'a.css')
		).toEqual([1, 1]);
	});
});

describe('Breadcrumbs label', () => {
	it('passes Breadcrumbs without a label, and a label on something else', () => {
		expect(check('a.svelte', '<Breadcrumbs items={crumbs} class="mb-4" />')).toEqual([]);
		expect(check('a.svelte', '<Field label="Name" />')).toEqual([]);
	});

	it('fails a label= prop, also on a later line of the tag', () => {
		expect(lines('<Breadcrumbs\n\titems={crumbs}\n\tlabel="Trail"\n/>')).toEqual([3]);
	});
});

describe('px-5 inside a Panel', () => {
	it('passes px-5 outside a Panel, and a Panel with its own class', () => {
		const ok = '<div class="px-5"></div>\n<Panel title="A" class="px-5">\n<p>Hi</p>\n</Panel>';
		expect(check('a.svelte', ok)).toEqual([]);
	});

	it('fails px-5 in a Panel body, nested ones included, but not after it closes', () => {
		const bad =
			'<Panel title="A">\n<Panel title="B" flush>\n<p class="md:px-5">x</p>\n</Panel>\n<p class="px-5">y</p>\n</Panel>\n<p class="px-5">z</p>';
		expect(lines(bad)).toEqual([3, 5]);
	});
});
