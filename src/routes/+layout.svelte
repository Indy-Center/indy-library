<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import {
		Footer,
		Header,
		INDY_CENTER_APPS,
		setColorScheme,
		setPositions,
		setTimeZone,
		type FooterColumn
	} from '@indy-center/centerline-svelte';
	import { loginUrl, logoutUrl } from '$lib/identity-links';
	import { SECTIONS } from '$lib/nav';

	let { children, data } = $props();

	setColorScheme({ fallback: 'dark' });
	// No saveToProfile: identity holds no time zone yet (identity time-zone 01).
	setTimeZone(() => data.timeZone);
	// Every Position below looks itself up in the catalogue's positions.
	setPositions(() => data.positions);

	const app = INDY_CENTER_APPS.find((app) => app.label === 'Library');

	const columns: FooterColumn[] = [
		{ heading: 'Library', links: SECTIONS.map(({ href, label }) => ({ href, label })) },
		{
			heading: 'Indy Center',
			links: [
				{ href: 'https://flyindycenter.com', label: 'Indy Center' },
				{ href: 'https://training.flyindycenter.com', label: 'Training' }
			]
		}
	];

	const isUnder = (path: string, section: string) =>
		path === section || path.startsWith(`${section}/`);

	// The nav marks the link a path is under, and "/" only on itself; a course's pages and the
	// tasks they teach belong to Courses, so they are marked as "/".
	let current = $derived(
		isUnder(page.url.pathname, '/courses') || isUnder(page.url.pathname, '/tasks')
			? '/'
			: page.url.pathname
	);

	// Absolute URL: identity rejects bare paths, and page.url.href is right during SSR.
	let signInHref = $derived(loginUrl(data.identityUrl, page.url.href));
	let signOutHref = $derived(logoutUrl(data.identityUrl, page.url.href));
</script>

<svelte:head>
	<title>Library | Indy Center</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<Header {app} nav={SECTIONS} {current} member={data.member} {signInHref} {signOutHref} />
	<main id="main" class="flex-1">
		<div class="mx-auto max-w-6xl px-4 py-8">
			{@render children?.()}
		</div>
	</main>
	<Footer {columns} />
</div>
