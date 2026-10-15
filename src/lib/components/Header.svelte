<script lang="ts">
	import { page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';
	import { logoutUrl } from '$lib/identity-links';
	import IconBook from '~icons/mdi/book-open-variant';
	import IconCompetencies from '~icons/mdi/format-list-checks';
	import IconLogout from '~icons/mdi/logout';

	let {
		reader,
		identityUrl
	}: { reader: { name: string; cid: string } | null; identityUrl: string } = $props();

	// Absolute URL: identity rejects bare paths, and page.url.href is right during SSR.
	let returnUrl = $derived(page.url.href);
	let path = $derived(page.url.pathname);
	let tabs = $derived([
		{
			href: '/',
			label: 'Courses',
			icon: IconBook,
			current: path === '/' || path.startsWith('/courses')
		},
		{
			href: '/competencies',
			label: 'Competencies',
			icon: IconCompetencies,
			current: path.startsWith('/competencies')
		}
	]);
</script>

<div class="relative z-20 mx-auto flex h-16 w-full max-w-7xl items-center justify-between p-2">
	<div class="flex items-center space-x-4">
		<a href="https://flyindycenter.com" class="cursor-pointer">
			<Logo class="h-8 w-auto" />
		</a>
		<nav class="flex space-x-2">
			{#each tabs as tab (tab.href)}
				<a
					href={tab.href}
					class="relative flex cursor-pointer items-center space-x-2 rounded-lg border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out
					{tab.current
						? 'border-sky-400 bg-sky-600/20 text-white shadow-lg'
						: 'text-gray-300 hover:bg-white/10 hover:text-white'}"
					aria-current={tab.current ? 'page' : undefined}
				>
					<tab.icon class="h-4 w-4" aria-hidden="true" />
					<span>{tab.label}</span>
				</a>
			{/each}
		</nav>
	</div>

	{#if reader}
		<div class="flex items-center space-x-3 text-sm">
			<div class="hidden text-right sm:block">
				<div class="font-medium text-gray-200">{reader.name}</div>
				<div class="font-mono text-xs text-gray-400">CID: {reader.cid}</div>
			</div>
			<a
				href={logoutUrl(identityUrl, returnUrl)}
				data-sveltekit-reload
				class="flex cursor-pointer items-center space-x-2 rounded-lg px-3 py-2 text-sm text-red-300 transition-colors duration-200 hover:bg-red-600/20 hover:text-red-200"
			>
				<IconLogout class="h-4 w-4" />
				<span class="hidden sm:inline">Sign Out</span>
			</a>
		</div>
	{/if}
</div>
