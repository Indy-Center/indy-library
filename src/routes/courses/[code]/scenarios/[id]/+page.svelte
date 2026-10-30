<script lang="ts">
	import {
		Airport,
		Badge,
		Breadcrumbs,
		DescriptionList,
		EmptyState,
		PageHeader,
		Panel
	} from '@indy-center/centerline-svelte';
	import ModeBadge from '$lib/components/ModeBadge.svelte';
	import Retired from '$lib/components/Retired.svelte';
	import RowLink from '$lib/components/RowLink.svelte';
	import ScenarioPosition from '$lib/components/ScenarioPosition.svelte';
	import TaskLink from '$lib/components/TaskLink.svelte';
	import TeacherNotes from '$lib/components/TeacherNotes.svelte';
	import TeacherNotesNotice from '$lib/components/TeacherNotesNotice.svelte';
	import DraftBanner from '$lib/components/DraftBanner.svelte';

	let { data } = $props();
	// Pages beneath a draft stay on the draft.
	let q = $derived(data.version.isDraft ? '?version=draft' : '');
	let scenario = $derived(data.scenario);
	let crumbs = $derived([
		{ href: '/', label: 'Courses' },
		{ href: `/courses/${data.course.code}${q}`, label: data.course.code },
		{ href: `/courses/${data.course.code}/scenarios/${scenario.id}${q}`, label: scenario.name }
	]);
</script>

<svelte:head>
	<title>{scenario.name} | Library | Indy Center</title>
</svelte:head>

<Breadcrumbs items={crumbs} />

{#if data.version.isDraft}
	<div class="mt-4"><DraftBanner number={data.version.number} /></div>
{/if}

<div class="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
	<span>Scenario</span>
	{#if scenario.retired}
		<Retired />
	{/if}
</div>
<PageHeader title={scenario.name} />

<DescriptionList class="mt-6 max-w-2xl">
	<div>
		<dt>Airport</dt>
		<dd><Airport airport={{ code: scenario.airport }} /></dd>
	</div>
	<div>
		<dt>Student position</dt>
		<dd><ScenarioPosition position={scenario.studentPosition} /></dd>
	</div>
	<div>
		<dt>Teacher position</dt>
		<dd><ScenarioPosition position={scenario.teacherPosition} /></dd>
	</div>
	{#if scenario.difficulty}
		<div>
			<dt>Difficulty</dt>
			<dd>{scenario.difficulty}</dd>
		</div>
	{/if}
	<div>
		<dt>Live or sim</dt>
		<dd><ModeBadge mode={scenario.mode} /></dd>
	</div>
</DescriptionList>

{#if data.showsTeacherNotes}
	<TeacherNotesNotice />
{/if}

<Panel title="Practical tasks" level={2} flush class="mt-8">
	{#if data.practicalTasks.length === 0}
		<EmptyState size="inline" class="px-4 py-4">This scenario has no practical tasks.</EmptyState>
	{:else}
		<ol class="divide-y divide-border">
			{#each data.practicalTasks as pt (pt.id)}
				<li class="px-4 py-3">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<TaskLink task={pt.task} />
						{#if pt.required}
							<Badge size="sm" variant="sky">Required</Badge>
						{:else}
							<Badge size="sm" variant="gray">Optional</Badge>
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
		<ul class="divide-y divide-border">
			{#each data.offeredBy as lp (lp.id)}
				<li>
					<RowLink
						href="/courses/{data.course.code}/lesson-plans/{lp.id}{q}"
						class="gap-4 px-4 py-3"
					>
						<span class="w-20 shrink-0 font-mono text-sm">{lp.code}</span>
						<span>{lp.title}</span>
					</RowLink>
				</li>
			{/each}
		</ul>
	</Panel>
{/if}
