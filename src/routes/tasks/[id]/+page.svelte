<script lang="ts">
	import {
		Badge,
		Breadcrumbs,
		EmptyState,
		Icon,
		Link,
		PageHeader,
		Panel,
		Text
	} from '@indy-center/centerline-svelte';
	import { mdiOpenInNew } from '@mdi/js';
	import TaskLink from '$lib/components/TaskLink.svelte';

	let { data } = $props();

	let trail = $derived(
		data.ancestors.length === 0
			? []
			: [...data.ancestors, data.task].map((t) => ({
					href: `/tasks/${t.id}`,
					label: `${t.number} ${t.name}`
				}))
	);
</script>

<svelte:head>
	<title>{data.task.number} {data.task.name} | Library | Indy Center</title>
</svelte:head>

{#if trail.length > 0}
	<Breadcrumbs items={trail} class="mb-4" />
{/if}

<div class="flex items-center gap-3">
	<span class="font-mono text-sm">Task {data.task.number}</span>
	{#if data.task.retired}
		<Badge size="sm" variant="gray" pill>Retired</Badge>
	{/if}
</div>

{#if data.task.description}
	<PageHeader title={data.task.name}>
		<span class="whitespace-pre-line">{data.task.description}</span>
	</PageHeader>
{:else}
	<PageHeader title={data.task.name} />
{/if}

{#if data.children.length > 0}
	<Panel title="Tasks beneath this one" level={2} flush class="mt-8">
		<ul class="divide-y divide-border">
			{#each data.children as child (child.id)}
				<li class="px-4 py-3"><TaskLink task={child} /></li>
			{/each}
		</ul>
	</Panel>
{/if}

<Panel title="Competencies" level={2} flush class="mt-8">
	{#if data.mappings.length === 0}
		<EmptyState size="inline" class="px-4 py-4">
			This task is not mapped to a competency yet.
		</EmptyState>
	{:else}
		<ul class="divide-y divide-border">
			{#each data.mappings as mapping (mapping.competency.id)}
				<li class="px-4 py-3">
					<Text size="small">{mapping.framework.name} {mapping.framework.edition}</Text>
					<Link
						href="/competencies/{mapping.competency.id}"
						class="inline-flex items-baseline gap-2"
					>
						<span class="font-mono text-sm">{mapping.competency.sourceId}</span>
						<span>{mapping.competency.title}</span>
					</Link>
					{#if mapping.inheritedFrom}
						<Text size="small" class="mt-1">
							Mapped on
							<Link href="/tasks/{mapping.inheritedFrom.id}">
								{mapping.inheritedFrom.number}
								{mapping.inheritedFrom.name}</Link
							>, above this task
						</Text>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</Panel>

{#if data.citations.length > 0}
	<Panel title="Sources" level={2} flush class="mt-8">
		<ul class="divide-y divide-border">
			{#each data.citations as citation, i (i)}
				<li class="px-4 py-3">
					{#if citation.url}
						<Link href={citation.url} target="_blank" rel="noopener noreferrer">
							{citation.name}
							<span class="sr-only">(opens in a new tab)</span>
							<Icon path={mdiOpenInNew} size="0.75em" />
						</Link>
					{:else}
						{citation.name}
					{/if}
					{citation.edition}
					{#if citation.place}<span class="font-mono text-sm">{citation.place}</span>{/if}
					{#if citation.title}
						· {citation.title}
					{/if}
				</li>
			{/each}
		</ul>
	</Panel>
{/if}
