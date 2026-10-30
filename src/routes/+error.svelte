<script lang="ts">
	import { page } from '$app/state';
	import { ErrorPage } from '@indy-center/centerline-svelte';
	import { mdiBookOpenVariant, mdiFormatListChecks } from '@mdi/js';
</script>

<svelte:head>
	<title>{page.status} | Library | Indy Center</title>
</svelte:head>

<ErrorPage
	status={page.status}
	message={page.error?.message}
	path={page.url.pathname}
	links={[
		{ label: 'Courses', href: '/', icon: mdiBookOpenVariant },
		{ label: 'Competencies', href: '/competencies', icon: mdiFormatListChecks }
	]}
/>
