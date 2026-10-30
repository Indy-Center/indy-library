<script lang="ts">
	import { page } from '$app/state';
	import { ErrorPage } from '@indy-center/centerline-svelte';
	import { SECTIONS } from '$lib/nav';
</script>

<svelte:head>
	<title>{page.status} | Library | Indy Center</title>
</svelte:head>

<ErrorPage
	status={page.status}
	message={page.error?.message}
	path={page.url.pathname}
	links={SECTIONS}
/>
