<script lang="ts">
	import { duration } from '$lib/format';
	import Section from '$lib/components/Section.svelte';
	import TaskLink from '$lib/components/TaskLink.svelte';
	import TeacherNotes from '$lib/components/TeacherNotes.svelte';
	import TeacherNotesNotice from '$lib/components/TeacherNotesNotice.svelte';
	import ModeBadge from '$lib/components/ModeBadge.svelte';
	import IconClock from '~icons/mdi/clock-outline';
	import IconExam from '~icons/mdi/clipboard-check-outline';

	import DraftBanner from '$lib/components/DraftBanner.svelte';

	let { data } = $props();
	// Pages beneath a draft stay on the draft.
	let q = $derived(data.version.isDraft ? '?version=draft' : '');
	let lp = $derived(data.lessonPlan);
</script>

<svelte:head>
	<title>{lp.code} {lp.title} | Library | Indy Center</title>
</svelte:head>

<nav class="text-sm text-gray-400">
	<a href="/" class="hover:text-sky-300">Courses</a>
	<span class="mx-1">/</span>
	<a href="/courses/{data.course.code}{q}" class="hover:text-sky-300">{data.course.code}</a>
	<span class="mx-1">/</span>
	<span>{data.module.title}</span>
</nav>

{#if data.version.isDraft}
	<div class="mt-4"><DraftBanner number={data.version.number} /></div>
{/if}

<header class="mt-2">
	<div class="font-mono text-sm text-sky-300">{lp.code}</div>
	<h1 class="text-3xl font-bold text-white">{lp.title}</h1>
	<div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-400">
		{#if lp.time}
			<span class="flex items-center gap-1">
				<IconClock class="h-4 w-4" aria-hidden="true" />
				{duration(lp.time)}
			</span>
		{/if}
		{#if lp.isExam}
			<span class="flex items-center gap-1 text-orange-300">
				<IconExam class="h-4 w-4" aria-hidden="true" /> Exam
			</span>
		{/if}
		{#if lp.minimum}
			<span>Minimum grade: {lp.minimum}</span>
		{/if}
	</div>
	{#if lp.description}
		<p class="mt-4 max-w-3xl text-gray-300">{lp.description}</p>
	{/if}
</header>

{#if lp.bodyHtml}
	<!-- Written by training staff in the CMS, whose rich-text editor produces this HTML. -->
	<article class="prose mt-8 max-w-3xl prose-invert prose-a:text-sky-300 prose-img:rounded-lg">
		{@html lp.bodyHtml}
	</article>
{/if}

{#if data.showsTeacherNotes}
	<TeacherNotesNotice />
{/if}

<Section title="Theory items">
	{#if data.theoryItems.length === 0}
		<p class="px-5 py-4 text-sm text-gray-400">This lesson plan has no theory items.</p>
	{:else}
		<ol class="divide-y divide-slate-700/60">
			{#each data.theoryItems as item (item.id)}
				<li class="px-5 py-3">
					<TaskLink task={item.task} />
					{#if item.teacherNotes}
						<TeacherNotes notes={item.teacherNotes} />
					{/if}
				</li>
			{/each}
		</ol>
	{/if}
</Section>

<Section title="Scenarios offered">
	{#if data.scenarios.length === 0}
		<p class="px-5 py-4 text-sm text-gray-400">This lesson plan offers no scenarios.</p>
	{:else}
		<ul class="divide-y divide-slate-700/60">
			{#each data.scenarios as scenario (scenario.id)}
				<li>
					<a
						href="/courses/{data.course.code}/scenarios/{scenario.id}{q}"
						class="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3 transition-colors duration-200 hover:bg-slate-700/40"
					>
						<span class="flex-1 font-medium text-white">{scenario.name}</span>
						<span class="font-mono text-sm text-gray-300">{scenario.position}</span>
						<span class="text-sm text-gray-400">{scenario.difficulty}</span>
						<ModeBadge mode={scenario.mode} />
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</Section>
