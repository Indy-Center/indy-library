<script lang="ts">
	import {
		Card,
		Disclosure,
		EmptyState,
		PageHeader,
		Tabs,
		Text
	} from '@indy-center/centerline-svelte';

	let { data } = $props();

	let tabs = $derived(
		data.tabs.map((tab) => ({ href: `?edition=${tab.id}`, label: `${tab.name} ${tab.edition}` }))
	);
	let current = $derived(`?edition=${data.tabs.find((tab) => tab.current)?.id}`);
</script>

<svelte:head>
	<title>Competencies | Library | Indy Center</title>
</svelte:head>

<PageHeader title="Competencies">
	What a controller must know and do, as each framework edition sets it out. Open one to read its
	wording, and follow it to the tasks that teach it.
</PageHeader>

<Tabs label="Framework editions" items={tabs} {current} class="mt-8" />

<Card flush class="mt-4">
	{#each data.folds as fold (fold.rows[0].id)}
		{@const beneath = fold.shared ? fold.rows.length : fold.rows.length - 1}
		<Disclosure class="border-b border-border px-4 last:border-0">
			{#snippet summary()}
				<span class="flex items-baseline gap-3">
					<span class="font-mono text-sm">
						{fold.from}{#if fold.to}&nbsp;–&nbsp;{fold.to}{/if}
					</span>
					<span class="line-clamp-1 flex-1 {fold.heading ? 'font-semibold' : ''}">{fold.title}</span
					>
					{#if beneath > 0}
						<Text as="span" size="small" class="shrink-0">
							{beneath}
							{fold.shared ? 'competencies' : 'beneath'}
						</Text>
					{/if}
				</span>
			{/snippet}
			<ul class="-ml-7 divide-y divide-border">
				{#each fold.rows as row (row.id)}
					<li>
						<a
							href="/competencies/{row.id}"
							class="flex items-baseline gap-3 py-3 pr-1 text-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
							style="padding-left: {1.75 + row.depth * 1.25}rem"
						>
							<span class="shrink-0 font-mono text-sm">{row.sourceId}</span>
							<span class={row.heading ? 'font-semibold' : ''}>{row.label}</span>
						</a>
						{#if row.wording}
							<Text
								size="small"
								class="-mt-2 max-w-3xl pr-1 pb-3 whitespace-pre-line"
								style="padding-left: {1.75 + row.depth * 1.25}rem"
							>
								{row.wording}
							</Text>
						{/if}
					</li>
				{/each}
			</ul>
		</Disclosure>
	{:else}
		<EmptyState size="inline" class="px-5 py-4">This edition has no competencies yet.</EmptyState>
	{/each}
</Card>
