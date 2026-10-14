<script lang="ts">
	import { duration } from '$lib/format';
	import IconClock from '~icons/mdi/clock-outline';
	import IconExam from '~icons/mdi/clipboard-check-outline';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.course.code} {data.course.title} | Indy Center Library</title>
</svelte:head>

<nav class="text-sm text-gray-400">
	<a href="/" class="hover:text-sky-300">Courses</a>
</nav>

<header class="mt-2">
	<div class="font-mono text-sm text-sky-300">{data.course.code}</div>
	<h1 class="text-3xl font-bold text-white">{data.course.title}</h1>
	<div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-400">
		<span>Version {data.version.number}</span>
		{#if data.version.time}
			<span class="flex items-center gap-1">
				<IconClock class="h-4 w-4" aria-hidden="true" />
				{duration(data.version.time)}
			</span>
		{/if}
		{#if data.version.academyRequired}
			<span>VATUSA Academy course required</span>
		{/if}
	</div>
	{#if data.version.description}
		<p class="mt-4 max-w-3xl text-gray-300">{data.version.description}</p>
	{/if}
</header>

<div class="mt-8 space-y-6">
	{#each data.modules as module, i (module.id)}
		<section class="rounded-lg border border-slate-700/60 bg-slate-800/60">
			<div class="border-b border-slate-700/60 px-5 py-4">
				<h2 class="text-sm font-semibold tracking-wide text-gray-400 uppercase">
					Module {i + 1}
				</h2>
				<div class="text-xl font-semibold text-white">{module.title}</div>
				{#if module.description}
					<p class="mt-1 text-sm text-gray-400">{module.description}</p>
				{/if}
			</div>
			<ol class="divide-y divide-slate-700/60">
				{#each module.lessonPlans as lp (lp.id)}
					<li>
						<a
							href="/courses/{data.course.code}/lesson-plans/{lp.id}"
							class="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3 transition-colors duration-200 hover:bg-slate-700/40"
						>
							<span class="w-20 shrink-0 font-mono text-sm text-sky-300">{lp.code}</span>
							<span class="flex-1 font-medium text-white">{lp.title}</span>
							{#if lp.isExam}
								<span class="flex items-center gap-1 text-xs text-orange-300">
									<IconExam class="h-4 w-4" aria-hidden="true" /> Exam
								</span>
							{/if}
							{#if lp.time}
								<span class="text-sm text-gray-400">{duration(lp.time)}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ol>
		</section>
	{:else}
		<p class="text-gray-400">This version has no modules yet.</p>
	{/each}
</div>
