// Style rules `svelte-check` cannot see. Run by `pnpm check`:
//
//   node scripts/check-style.mjs
//
// Scans src/**/*.svelte, *.css and *.ts and exits 1, printing file:line for each slip:
//   1. a raw Tailwind palette colour class (`bg-red-500`, `dark:text-white`): use Centerline's
//      role classes (`bg-muted`, `text-foreground-soft`...)
//   2. a hex, rgb(), rgba() or hsl() colour in a .svelte or .css file: use a Centerline token
//   3. a `label=` prop on <Breadcrumbs>: the component's default is right
//   4. `px-5` on an element inside a <Panel> body: the Panel pads its own body
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PREFIXES = [
	'bg',
	'text',
	'border',
	'ring',
	'outline',
	'fill',
	'stroke',
	'from',
	'via',
	'to',
	'divide',
	'placeholder',
	'decoration',
	'shadow',
	'accent',
	'caret'
];
const PALETTES = [
	'slate',
	'gray',
	'zinc',
	'neutral',
	'stone',
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'violet',
	'purple',
	'fuchsia',
	'pink',
	'rose'
];

// A utility is a whole token: not glued to a longer word, and any `dark:`/`hover:` variants
// before it end in a colon, so they are not part of the lookbehind's class.
const PALETTE_CLASS = new RegExp(
	`(?<![\\w-])(?:${PREFIXES.join('|')})-(?:(?:${PALETTES.join('|')})-\\d{2,3}(?:/[\\w.\\[\\]%]+)?|(?:white|black)(?![\\w-])(?:/[\\w.\\[\\]%]+)?)`,
	'g'
);
const COLOUR_LITERAL =
	/(?<![\w&#-])(?<!href=["'])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])|\b(?:rgba?|hsla?)\(/g;
const PX_5 = /(?<![\w-])px-5(?![\w-])/g;

/** Index of the `>` that ends the tag starting at `start`, skipping quotes and `{...}`. */
function tagEnd(text, start) {
	let braces = 0;
	let quote = null;
	for (let i = start; i < text.length; i++) {
		const c = text[i];
		if (braces > 0) {
			if (c === '{') braces++;
			else if (c === '}') braces--;
		} else if (quote) {
			if (c === quote) quote = null;
		} else if (c === '"' || c === "'") quote = c;
		else if (c === '{') braces = 1;
		else if (c === '>') return i;
	}
	return text.length;
}

/** Problems in one file's text: `{ line, message }`, in line order. `file` picks the rules. */
export function checkSource(file, text) {
	const problems = [];
	const lineOf = (index) => text.slice(0, index).split('\n').length;
	const flag = (index, message) => problems.push({ line: lineOf(index), message });
	const scan = (pattern, from, to, message) => {
		for (const m of text.slice(from, to).matchAll(pattern)) flag(from + m.index, message(m[0]));
	};

	scan(
		PALETTE_CLASS,
		0,
		text.length,
		(m) => `raw palette colour class "${m}"; use a Centerline role class`
	);

	const markup = file.endsWith('.svelte');
	if (markup || file.endsWith('.css')) {
		scan(COLOUR_LITERAL, 0, text.length, (m) => `raw colour "${m}"; use a Centerline token`);
	}

	if (markup) {
		for (const open of text.matchAll(/<Breadcrumbs(?![\w.])/g)) {
			const end = tagEnd(text, open.index);
			for (const m of text.slice(open.index, end).matchAll(/(?<![\w-])label\s*=/g)) {
				flag(open.index + m.index, '<Breadcrumbs> with a label= prop; use its default');
			}
		}

		// Panel bodies, nesting-aware: from the end of an opening tag to its matching </Panel>.
		const depthStack = [];
		for (const m of text.matchAll(/<Panel(?![\w.])|<\/Panel\s*>/g)) {
			if (m[0].startsWith('</')) {
				const from = depthStack.pop();
				if (from !== undefined) scan(PX_5, from, m.index, () => 'px-5 inside a <Panel> body');
			} else {
				const end = tagEnd(text, m.index);
				if (text[end - 1] !== '/') depthStack.push(end + 1);
			}
		}
	}

	// Nested Panels scan the same text twice; report each slip once.
	const seen = new Set();
	return problems
		.filter((p) => !seen.has(`${p.line}:${p.message}`) && seen.add(`${p.line}:${p.message}`))
		.sort((a, b) => a.line - b.line);
}

function* sourceFiles(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) yield* sourceFiles(path);
		else if (/\.(svelte|css|ts)$/.test(entry.name)) yield path;
	}
}

/** Checks every source file under `root`/src; returns the printable lines. */
export function checkTree(root) {
	const lines = [];
	for (const path of sourceFiles(join(root, 'src'))) {
		for (const { line, message } of checkSource(path, readFileSync(path, 'utf8'))) {
			lines.push(`${relative(root, path)}:${line}: ${message}`);
		}
	}
	return lines;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = fileURLToPath(new URL('..', import.meta.url));
	const lines = checkTree(root);
	if (lines.length > 0) {
		console.error(lines.join('\n'));
		console.error(`\n${lines.length} style problem(s).`);
		process.exit(1);
	}
}
