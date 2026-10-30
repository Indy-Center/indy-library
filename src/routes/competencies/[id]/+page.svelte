<script lang="ts">
	import {
		Badge,
		Breadcrumbs,
		DescriptionList,
		EmptyState,
		PageHeader,
		Panel,
		Text
	} from '@indy-center/centerline-svelte';

	let { data } = $props();
	let competency = $derived(data.competency);

	let trail = $derived([
		data.framework
			? {
					href: `/competencies?edition=${competency.frameworkId}`,
					label: `${data.framework.name} ${data.framework.edition}`
				}
			: { href: '/competencies', label: 'Competencies' },
		...(data.parent
			? [
					{
						href: `/competencies/${data.parent.id}`,
						label: `${data.parent.sourceId} ${data.parent.title}`
					}
				]
			: []),
		{
			href: `/competencies/${competency.id}`,
			label: `${competency.sourceId} ${competency.title}`
		}
	]);

	const rowLink =
		'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 text-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring';
</script>

<svelte:head>
	<title>{competency.sourceId} {competency.title} | Library | Indy Center</title>
</svelte:head>

<Breadcrumbs items={trail} label="Competency tree" class="mb-4" />

<div class="font-mono text-sm">{competency.sourceId}</div>

{#if competency.text}
	<PageHeader title={competency.title}>
		<span class="whitespace-pre-line">{competency.text}</span>
	</PageHeader>
{:else}
	<PageHeader title={competency.title} />
{/if}

{#if competency.sourceReference || competency.pairedGcapCode}
	<DescriptionList class="mt-6">
		{#if competency.sourceReference}
			<div>
				<dt>Source reference</dt>
				<dd>{competency.sourceReference}</dd>
			</div>
		{/if}
		{#if competency.pairedGcapCode}
			<div>
				<dt>Paired GCAP code</dt>
				<dd class="font-mono">{competency.pairedGcapCode}</dd>
			</div>
		{/if}
	</DescriptionList>
{/if}

{#if data.rubric.theory || data.rubric.practical}
	<Panel title="Rating exam rubric" level={2} class="mt-8">
		<DescriptionList>
			{#if data.rubric.theory}
				<div>
					<dt>Theory</dt>
					<dd class="whitespace-pre-line">{data.rubric.theory}</dd>
				</div>
			{/if}
			{#if data.rubric.practical}
				<div>
					<dt>Practical</dt>
					<dd class="whitespace-pre-line">{data.rubric.practical}</dd>
				</div>
			{/if}
		</DescriptionList>
	</Panel>
{/if}

{#if data.children.length > 0}
	<Panel title="Competencies beneath this one" level={2} flush class="mt-8">
		<ul class="divide-y divide-border">
			{#each data.children as child (child.id)}
				<li>
					<a href="/competencies/{child.id}" class={rowLink}>
						<span class="flex items-baseline gap-2">
							<span class="font-mono text-sm">{child.sourceId}</span>
							<span>{child.title}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</Panel>
{/if}

<Panel title="Taught by" level={2} flush class="mt-8">
	{#if data.tasks.length === 0}
		<EmptyState size="inline" class="px-5 py-4">
			No task is mapped to this competency yet.
		</EmptyState>
	{:else}
		<ul class="divide-y divide-border">
			{#each data.tasks as mapped (mapped.task.id)}
				<li>
					<a href="/tasks/{mapped.task.id}" class={rowLink}>
						<span class="flex items-baseline gap-2">
							<span class="font-mono text-sm">{mapped.task.number}</span>
							<span>{mapped.task.name}</span>
						</span>
						{#if mapped.retired || mapped.inheritedFrom}
							<span class="flex items-baseline gap-2">
								{#if mapped.retired}<Badge size="sm" variant="gray">Retired</Badge>{/if}
								{#if mapped.inheritedFrom}
									<Text as="span" size="small">Through {mapped.inheritedFrom.number}</Text>
								{/if}
							</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</Panel>
