<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import TaskLink from '$lib/components/TaskLink.svelte';
	import IconLink from '~icons/mdi/open-in-new';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.task.number} {data.task.name} | Indy Center Library</title>
</svelte:head>

<nav class="flex flex-wrap items-baseline gap-x-1 text-sm text-gray-400" aria-label="Task tree">
	<span>Tasks</span>
	{#each data.ancestors as ancestor (ancestor.id)}
		<span>/</span>
		<a href="/tasks/{ancestor.id}" class="hover:text-sky-300">
			{ancestor.number}
			{ancestor.name}
		</a>
	{/each}
</nav>

<header class="mt-2">
	<div class="flex items-center gap-3">
		<span class="font-mono text-sm text-sky-300">Task {data.task.number}</span>
		{#if data.task.retired}
			<span
				class="rounded-lg border border-gray-500/30 bg-gray-500/10 px-2 py-0.5 text-xs text-gray-300"
			>
				Retired
			</span>
		{/if}
	</div>
	<h1 class="text-3xl font-bold text-white">{data.task.name}</h1>
	{#if data.task.description}
		<p class="mt-4 max-w-3xl whitespace-pre-line text-gray-300">{data.task.description}</p>
	{/if}
</header>

{#if data.children.length > 0}
	<Section title="Tasks beneath this one">
		<ul class="divide-y divide-slate-700/60">
			{#each data.children as child (child.id)}
				<li class="px-5 py-3"><TaskLink task={child} /></li>
			{/each}
		</ul>
	</Section>
{/if}

<Section title="Competencies">
	{#if data.mappings.length === 0}
		<p class="px-5 py-4 text-sm text-gray-400">This task is not mapped to a competency yet.</p>
	{:else}
		<ul class="divide-y divide-slate-700/60">
			{#each data.mappings as mapping (mapping.competency.id)}
				<li class="px-5 py-3">
					<a href="/competencies/{mapping.competency.id}" class="group block">
						<span class="text-xs text-gray-400">
							{mapping.framework.name}
							{mapping.framework.edition}
						</span>
						<span class="flex items-baseline gap-2">
							<span class="font-mono text-sm text-sky-300">{mapping.competency.sourceId}</span>
							<span class="text-white group-hover:text-sky-200">{mapping.competency.title}</span>
						</span>
					</a>
					{#if mapping.inheritedFrom}
						<p class="mt-1 text-xs text-gray-400">
							Mapped on
							<a href="/tasks/{mapping.inheritedFrom.id}" class="text-gray-300 hover:text-sky-300">
								{mapping.inheritedFrom.number}
								{mapping.inheritedFrom.name}</a
							>, above this task
						</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</Section>

{#if data.citations.length > 0}
	<Section title="References">
		<ul class="divide-y divide-slate-700/60">
			{#each data.citations as citation, i (i)}
				<li class="flex flex-wrap items-baseline gap-x-3 px-5 py-3">
					{#if citation.url}
						<a
							href={citation.url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1 text-white hover:text-sky-200"
						>
							{citation.name}
							<IconLink class="h-3 w-3" aria-hidden="true" />
						</a>
					{:else}
						<span class="text-white">{citation.name}</span>
					{/if}
					<span class="text-sm text-gray-400">{citation.edition}</span>
					{#if citation.section}
						<span class="font-mono text-sm text-sky-300">{citation.section}</span>
					{/if}
				</li>
			{/each}
		</ul>
	</Section>
{/if}
