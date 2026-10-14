<script lang="ts">
	import Section from '$lib/components/Section.svelte';
	import TaskLink from '$lib/components/TaskLink.svelte';

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
