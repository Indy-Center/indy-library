<script lang="ts">
	let { mode }: { mode: 'live' | 'sim' } = $props();
</script>

<span
	class="rounded-lg border px-2 py-0.5 text-xs font-medium {mode === 'live'
		? 'border-green-500/30 bg-green-500/10 text-green-300'
		: 'border-sky-500/30 bg-sky-500/10 text-sky-300'}"
>
	{mode === 'live' ? 'Live' : 'Sim'}
</span>
