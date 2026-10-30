<script lang="ts">
	import ModeBadge from '$lib/components/ModeBadge.svelte';
	import { Badge, Panel } from '@indy-center/centerline-svelte';
	import TaskLink from '$lib/components/TaskLink.svelte';
	import TeacherNotes from '$lib/components/TeacherNotes.svelte';
	import TeacherNotesNotice from '$lib/components/TeacherNotesNotice.svelte';

	import DraftBanner from '$lib/components/DraftBanner.svelte';

	let { data } = $props();
	// Pages beneath a draft stay on the draft.
	let q = $derived(data.version.isDraft ? '?version=draft' : '');
	let scenario = $derived(data.scenario);
</script>

<svelte:head>
	<title>{scenario.name} | Library | Indy Center</title>
</svelte:head>

<nav class="text-sm text-gray-400">
	<a href="/" class="hover:text-sky-300">Courses</a>
	<span class="mx-1">/</span>
	<a href="/courses/{data.course.code}{q}" class="hover:text-sky-300">{data.course.code}</a>
	<span class="mx-1">/</span>
	<span>Scenarios</span>
</nav>

{#if data.version.isDraft}
	<div class="mt-4"><DraftBanner number={data.version.number} /></div>
{/if}

<header class="mt-2">
	<div class="flex items-center gap-3">
		<span class="text-sm text-sky-300">Scenario</span>
		{#if scenario.retired}
			<Badge size="sm" variant="gray">Retired</Badge>
		{/if}
	</div>
	<h1 class="text-3xl font-bold text-white">{scenario.name}</h1>
	<dl class="mt-4 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
		<div>
			<dt class="text-xs tracking-wide text-gray-400 uppercase">Airport</dt>
			<dd class="font-mono text-white">{scenario.airport}</dd>
		</div>
		<div>
			<dt class="text-xs tracking-wide text-gray-400 uppercase">Position</dt>
			<dd class="font-mono text-white">{scenario.position}</dd>
		</div>
		<div>
			<dt class="text-xs tracking-wide text-gray-400 uppercase">Difficulty</dt>
			<dd class="text-white">{scenario.difficulty}</dd>
		</div>
		<div>
			<dt class="text-xs tracking-wide text-gray-400 uppercase">Live or sim</dt>
			<dd><ModeBadge mode={scenario.mode} /></dd>
		</div>
	</dl>
</header>

{#if data.showsTeacherNotes}
	<TeacherNotesNotice />
{/if}

<Panel title="Practical tasks" level={2} flush class="mt-8">
	{#if data.practicalTasks.length === 0}
		<p class="px-5 py-4 text-sm text-gray-400">This scenario has no practical tasks.</p>
	{:else}
		<ol class="divide-y divide-slate-700/60">
			{#each data.practicalTasks as pt (pt.id)}
				<li class="px-5 py-3">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<TaskLink task={pt.task} />
						{#if pt.required}
							<span class="text-xs font-medium text-sky-300">Required</span>
						{:else}
							<span class="text-xs text-gray-400">Optional</span>
						{/if}
					</div>
					{#if pt.teacherNotes}
						<TeacherNotes notes={pt.teacherNotes} />
					{/if}
				</li>
			{/each}
		</ol>
	{/if}
</Panel>

{#if data.offeredBy.length > 0}
	<Panel title="Offered by" level={2} flush class="mt-8">
		<ul class="divide-y divide-slate-700/60">
			{#each data.offeredBy as lp (lp.id)}
				<li>
					<a
						href="/courses/{data.course.code}/lesson-plans/{lp.id}{q}"
						class="flex items-baseline gap-4 px-5 py-3 transition-colors duration-200 hover:bg-slate-700/40"
					>
						<span class="w-20 shrink-0 font-mono text-sm text-sky-300">{lp.code}</span>
						<span class="text-white">{lp.title}</span>
					</a>
				</li>
			{/each}
		</ul>
	</Panel>
{/if}
