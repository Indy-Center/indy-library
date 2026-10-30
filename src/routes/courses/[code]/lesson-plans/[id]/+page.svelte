<script lang="ts">
	import { duration } from '$lib/format';
	import {
		Badge,
		Breadcrumbs,
		EmptyState,
		Icon,
		PageHeader,
		Panel,
		Prose
	} from '@indy-center/centerline-svelte';
	import { mdiClockOutline } from '@mdi/js';
	import TaskLink from '$lib/components/TaskLink.svelte';
	import TeacherNotes from '$lib/components/TeacherNotes.svelte';
	import TeacherNotesNotice from '$lib/components/TeacherNotesNotice.svelte';
	import ModeBadge from '$lib/components/ModeBadge.svelte';
	import DraftBanner from '$lib/components/DraftBanner.svelte';

	let { data } = $props();
	// Pages beneath a draft stay on the draft.
	let q = $derived(data.version.isDraft ? '?version=draft' : '');
	let lp = $derived(data.lessonPlan);
	let crumbs = $derived([
		{ href: '/', label: 'Courses' },
		{ href: `/courses/${data.course.code}${q}`, label: data.course.code },
		{
			href: `/courses/${data.course.code}/lesson-plans/${lp.id}${q}`,
			label: `${lp.code} ${lp.title}`
		}
	]);
</script>

<svelte:head>
	<title>{lp.code} {lp.title} | Library | Indy Center</title>
</svelte:head>

<Breadcrumbs items={crumbs} />

{#if data.version.isDraft}
	<div class="mt-4"><DraftBanner number={data.version.number} /></div>
{/if}

<div class="mt-4 font-mono text-sm text-muted-foreground">{lp.code}</div>
{#if lp.description}
	<PageHeader title={lp.title}>{lp.description}</PageHeader>
{:else}
	<PageHeader title={lp.title} />
{/if}
<div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
	<span>Module {lp.moduleNumber} · {data.module.title}</span>
	{#if lp.time}
		<span class="flex items-center gap-1">
			<Icon path={mdiClockOutline} />
			{duration(lp.time)}
		</span>
	{/if}
	{#if lp.isExam}
		<Badge size="sm" variant="orange">Exam</Badge>
	{/if}
	{#if lp.minimum}
		<span>Minimum grade: {lp.minimum}</span>
	{/if}
</div>

{#if lp.bodyHtml}
	<!-- Written by training staff in the CMS, whose rich-text editor produces this HTML. -->
	<Prose class="mt-8">{@html lp.bodyHtml}</Prose>
{/if}

{#if data.showsTeacherNotes}
	<TeacherNotesNotice />
{/if}

<Panel title="Theory items" level={2} flush class="mt-8">
	{#if data.theoryItems.length === 0}
		<EmptyState size="inline" class="px-5 py-4">This lesson plan has no theory items.</EmptyState>
	{:else}
		<ol class="divide-y divide-border">
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
</Panel>

<Panel title="Scenarios offered" level={2} flush class="mt-8">
	{#if data.scenarios.length === 0}
		<EmptyState size="inline" class="px-5 py-4">This lesson plan offers no scenarios.</EmptyState>
	{:else}
		<ul class="divide-y divide-border">
			{#each data.scenarios as scenario (scenario.id)}
				<li>
					<a
						href="/courses/{data.course.code}/scenarios/{scenario.id}{q}"
						class="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3 text-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
					>
						<span class="flex-1 font-medium">{scenario.name}</span>
						<span class="font-mono text-sm text-foreground-soft">{scenario.position}</span>
						{#if scenario.difficulty}
							<span class="text-sm text-muted-foreground">{scenario.difficulty}</span>
						{/if}
						<ModeBadge mode={scenario.mode} />
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</Panel>
