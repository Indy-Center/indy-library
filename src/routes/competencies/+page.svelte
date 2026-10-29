<script lang="ts">
	import IconChevron from '~icons/mdi/chevron-right';

	let { data } = $props();
</script>

<svelte:head>
	<title>Competencies | Library | Indy Center</title>
</svelte:head>

<h1 class="text-3xl font-bold text-white">Competencies</h1>
<p class="mt-2 max-w-3xl text-gray-300">
	What a controller must know and do, as each framework edition sets it out. Open one to read its
	wording, and follow it to the tasks that teach it.
</p>

<nav class="mt-8 flex flex-wrap gap-1 border-b border-slate-700/60" aria-label="Framework editions">
	{#each data.tabs as tab (tab.id)}
		<a
			href="?edition={tab.id}"
			class="-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium
			{tab.current ? 'border-sky-400 text-white' : 'border-transparent text-gray-400 hover:text-white'}"
			aria-current={tab.current ? 'page' : undefined}
		>
			{tab.name} <span class="text-xs text-gray-500">{tab.edition}</span>
		</a>
	{/each}
</nav>

<section class="rounded-b-lg border border-t-0 border-slate-700/60 bg-slate-800/60 text-white">
	{#each data.folds as fold (fold.rows[0].id)}
		{@const beneath = fold.shared ? fold.rows.length : fold.rows.length - 1}
		<details class="group border-b border-slate-700/60 last:border-0">
			<summary
				class="flex cursor-pointer list-none items-baseline gap-3 px-5 py-3 hover:bg-slate-700/40 [&::-webkit-details-marker]:hidden"
			>
				<IconChevron
					class="h-4 w-4 shrink-0 self-center text-gray-500 transition-transform group-open:rotate-90"
					aria-hidden="true"
				/>
				<span class="font-mono text-sm text-sky-300">
					{fold.from}{#if fold.to}&nbsp;–&nbsp;{fold.to}{/if}
				</span>
				<span
					class="line-clamp-1 flex-1 {fold.heading ? 'font-semibold text-white' : 'text-gray-100'}"
				>
					{fold.title}
				</span>
				{#if beneath > 0}
					<span class="shrink-0 text-xs text-gray-500">
						{beneath}
						{fold.shared ? 'competencies' : 'beneath'}
					</span>
				{/if}
			</summary>
			<ul class="divide-y divide-slate-700/40 bg-gray-900/40">
				{#each fold.rows as row (row.id)}
					<li class="py-3 pr-5" style="padding-left: {1.25 + row.depth * 1.25}rem">
						<a href="/competencies/{row.id}" class="group/row flex items-baseline gap-3">
							<span class="shrink-0 font-mono text-sm text-sky-300">{row.sourceId}</span>
							<span
								class="group-hover/row:text-sky-200 {row.heading
									? 'font-semibold text-white'
									: 'text-gray-100'}"
							>
								{row.label}
							</span>
						</a>
						{#if row.wording}
							<p class="mt-1 max-w-3xl text-sm whitespace-pre-line text-gray-400">
								{row.wording}
							</p>
						{/if}
					</li>
				{/each}
			</ul>
		</details>
	{:else}
		<p class="px-5 py-4 text-sm text-gray-400">This edition has no competencies yet.</p>
	{/each}
</section>
