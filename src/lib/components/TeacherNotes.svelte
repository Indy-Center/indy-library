<script lang="ts">
	import IconTeach from '~icons/mdi/human-male-board';

	let { notes }: { notes: string } = $props();
</script>

<div
	class="mt-2 rounded-md border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm text-purple-100"
>
	<div
		class="mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide text-purple-300 uppercase"
	>
		<IconTeach class="h-4 w-4" aria-hidden="true" />
		Teacher notes
	</div>
	<p class="whitespace-pre-line">{notes}</p>
</div>
