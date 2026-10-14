<script lang="ts">
	import IconDraft from '~icons/mdi/file-document-edit-outline';

	let { number, currentHref }: { number: number; currentHref?: string | null } = $props();
</script>

<div
	class="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200"
	role="note"
>
	<span class="flex items-center gap-2 font-semibold tracking-wide uppercase">
		<IconDraft class="h-5 w-5" aria-hidden="true" />
		Draft, version {number}
	</span>
	<span class="flex-1 text-yellow-100/80">
		Not published. Only this course's authors, the Training Admin and lead instructors see it.
	</span>
	{#if currentHref}
		<a href={currentHref} class="text-yellow-100 underline hover:text-white">
			Read the current version
		</a>
	{/if}
</div>
