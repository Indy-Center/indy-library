<!-- The alert at the top of every draft page: which edition, who sees it, and a way to the current one. -->
<script lang="ts">
	import { Alert, Link } from '@indy-center/centerline-svelte';

	let { number, currentHref }: { number: number; currentHref?: string | null } = $props();
</script>

<Alert level="info" title="Draft, edition {number}" class="mb-6">
	Not published. Only this course's authors, the Training Admin and lead instructors see it.
	{#if currentHref}
		<Link href={currentHref}>Read the current edition</Link>
	{/if}
</Alert>
