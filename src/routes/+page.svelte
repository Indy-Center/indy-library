<script lang="ts">
	import IconSchool from '~icons/mdi/school';

	let { data } = $props();
</script>

<svelte:head>
	<title>Courses | Indy Center Library</title>
</svelte:head>

<h1 class="text-3xl font-bold text-white">Courses</h1>
<p class="mt-2 text-gray-400">The current version of every Indy Center course.</p>

{#if data.courses.length === 0}
	<p class="mt-8 text-gray-400">No course has been published yet.</p>
{:else}
	<ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.courses as course (course.code)}
			<li>
				<a
					href={course.hasCurrent
						? `/courses/${course.code}`
						: `/courses/${course.code}?version=draft`}
					class="block h-full rounded-lg border border-slate-700/60 bg-slate-800/60 p-5 transition-colors duration-200 hover:border-sky-500/50 hover:bg-slate-700/60"
				>
					<div class="flex items-center gap-2 font-mono text-sm text-sky-300">
						<IconSchool class="h-4 w-4" aria-hidden="true" />
						{course.code}
					</div>
					<div class="mt-2 text-lg font-semibold text-white">{course.title}</div>
					{#if course.draft !== null}
						<div class="mt-3 text-xs font-medium text-yellow-300">
							{course.hasCurrent ? `Draft version ${course.draft} in progress` : 'Draft only'}
						</div>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
{/if}
