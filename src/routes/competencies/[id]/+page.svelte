<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import TaskLink from '$lib/components/TaskLink.svelte';

	let { data } = $props();
	let competency = $derived(data.competency);
</script>

<svelte:head>
	<title>{competency.sourceId} {competency.title} | Library | Indy Center</title>
</svelte:head>

<nav class="flex flex-wrap items-baseline gap-x-1 text-sm text-gray-400">
	{#if data.framework}
		<span>{data.framework.name} {data.framework.edition}</span>
	{/if}
	{#if data.parent}
		<span>/</span>
		<a href="/competencies/{data.parent.id}" class="hover:text-sky-300">
			{data.parent.sourceId}
			{data.parent.title}
		</a>
	{/if}
</nav>

<header class="mt-2">
	<div class="font-mono text-sm text-sky-300">{competency.sourceId}</div>
	<h1 class="text-3xl font-bold text-white">{competency.title}</h1>
	{#if competency.text}
		<p class="mt-4 max-w-3xl whitespace-pre-line text-gray-300">{competency.text}</p>
	{/if}
	<dl class="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
		{#if competency.sourceReference}
			<div>
				<dt class="text-xs tracking-wide text-gray-400 uppercase">Source reference</dt>
				<dd class="text-gray-200">{competency.sourceReference}</dd>
			</div>
		{/if}
		{#if competency.pairedGcapCode}
			<div>
				<dt class="text-xs tracking-wide text-gray-400 uppercase">Paired GCAP code</dt>
				<dd class="font-mono text-gray-200">{competency.pairedGcapCode}</dd>
			</div>
		{/if}
	</dl>
</header>

{#if data.rubric.theory || data.rubric.practical}
	<Section title="Rating exam rubric">
		<dl class="divide-y divide-slate-700/60">
			{#if data.rubric.theory}
				<div class="px-5 py-3">
					<dt class="text-xs tracking-wide text-gray-400 uppercase">Theory</dt>
					<dd class="mt-1 whitespace-pre-line text-gray-200">{data.rubric.theory}</dd>
				</div>
			{/if}
			{#if data.rubric.practical}
				<div class="px-5 py-3">
					<dt class="text-xs tracking-wide text-gray-400 uppercase">Practical</dt>
					<dd class="mt-1 whitespace-pre-line text-gray-200">{data.rubric.practical}</dd>
				</div>
			{/if}
		</dl>
	</Section>
{/if}

{#if data.children.length > 0}
	<Section title="Competencies beneath this one">
		<ul class="divide-y divide-slate-700/60">
			{#each data.children as child (child.id)}
				<li class="px-5 py-3">
					<a href="/competencies/{child.id}" class="group flex items-baseline gap-2">
						<span class="font-mono text-sm text-sky-300">{child.sourceId}</span>
						<span class="text-white group-hover:text-sky-200">{child.title}</span>
					</a>
				</li>
			{/each}
		</ul>
	</Section>
{/if}

<Section title="Taught by">
	{#if data.tasks.length === 0}
		<p class="px-5 py-4 text-sm text-gray-400">No task is mapped to this competency yet.</p>
	{:else}
		<ul class="divide-y divide-slate-700/60">
			{#each data.tasks as mapped (mapped.task.id)}
				<li class="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3">
					<TaskLink task={mapped.task} />
					<span class="text-xs text-gray-400">
						{#if mapped.retired}Retired.{/if}
						{#if mapped.inheritedFrom}Through {mapped.inheritedFrom.number}{/if}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</Section>
