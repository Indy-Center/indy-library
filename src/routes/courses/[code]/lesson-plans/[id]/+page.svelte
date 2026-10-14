<script lang="ts">
	import { duration } from '$lib/format';
	import IconClock from '~icons/mdi/clock-outline';
	import IconExam from '~icons/mdi/clipboard-check-outline';

	let { data } = $props();
	let lp = $derived(data.lessonPlan);
</script>

<svelte:head>
	<title>{lp.code} {lp.title} | Indy Center Library</title>
</svelte:head>

<nav class="text-sm text-gray-400">
	<a href="/" class="hover:text-sky-300">Courses</a>
	<span class="mx-1">/</span>
	<a href="/courses/{data.course.code}" class="hover:text-sky-300">{data.course.code}</a>
	<span class="mx-1">/</span>
	<span>{data.module.title}</span>
</nav>

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
