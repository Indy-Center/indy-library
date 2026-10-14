<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<section class="mt-8 rounded-lg border border-slate-700/60 bg-slate-800/60 text-white">
	<div class="border-b border-slate-700/60 px-5 py-3">
		<h2 class="text-sm font-semibold tracking-wide uppercase">{title}</h2>
	</div>
	{@render children()}
</section>
