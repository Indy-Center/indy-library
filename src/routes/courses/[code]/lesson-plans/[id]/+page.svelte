<script lang="ts">
	import { onMount } from 'svelte';
	import { duration } from '$lib/format';
	import {
		Airport,
		Badge,
		Breadcrumbs,
		Button,
		Disclosure,
		EmptyState,
		Heading,
		Icon,
		Link,
		PageHeader,
		Panel,
		Prose
	} from '@indy-center/centerline-svelte';
	import { mdiChevronRight, mdiClockOutline } from '@mdi/js';
	import Retired from '$lib/components/Retired.svelte';
	import ScenarioPosition from '$lib/components/ScenarioPosition.svelte';
	import TeacherNotes from '$lib/components/TeacherNotes.svelte';
	import TeacherNotesNotice from '$lib/components/TeacherNotesNotice.svelte';
	import DraftBanner from '$lib/components/DraftBanner.svelte';
	import type { TaskDetail, TaskNode } from './tasks';

	let { data } = $props();
	// Pages beneath a draft stay on the draft.
	let q = $derived(data.version.isDraft ? '?version=draft' : '');
	let lp = $derived(data.lessonPlan);
	let tasks = $derived(data.tasks);
	let crumbs = $derived([
		{ href: '/', label: 'Courses' },
		{ href: `/courses/${data.course.code}${q}`, label: data.course.code },
		{
			href: `/courses/${data.course.code}/lesson-plans/${lp.id}${q}`,
			label: `${lp.code} ${lp.title}`
		}
	]);
	const lessonPlanHref = (id: string) => `/courses/${data.course.code}/lesson-plans/${id}${q}`;
	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

	// Every fold of the task list (areas, headings, tasks) is a native <details>, open to start,
	// so the page reads with no JavaScript; only these buttons and the jump links need it.
	let taskList: HTMLElement | undefined = $state();
	function foldAll(open: boolean) {
		taskList?.querySelectorAll('details').forEach((d) => (d.open = open));
	}
	// A jump link opens its panel if it is folded; the browser then scrolls to it.
	function openArea(id: string) {
		const target = document.getElementById(id);
		if (target instanceof HTMLDetailsElement) target.open = true;
	}
	onMount(() => {
		if (location.hash.startsWith('#area-')) openArea(location.hash.slice(1));
	});
</script>

<svelte:head>
	<title>{lp.code} {lp.title} | Library | Indy Center</title>
</svelte:head>

<!-- The two columns every task row shares, lined up down the whole list: the number and the
     Know, Do and Read labels right-aligned in the first, the text in the second. -->
{#snippet detailCells(detail: TaskDetail)}
	{#if detail.knowledge}
		<span class="label">Know</span>
		<p class="m-0">{detail.knowledge}</p>
	{/if}
	{#if detail.skill}
		<span class="label">Do</span>
		<p class="m-0">{detail.skill}</p>
	{/if}
	{#if detail.citations.length > 0}
		<span class="label">Read</span>
		<ul class="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-sm">
			{#each detail.citations as citation, i (i)}
				{@const text = citation.source ? `${citation.source} · ${citation.text}` : citation.text}
				<li class="min-w-0 [overflow-wrap:anywhere]">
					{#if citation.url}
						<Link href={citation.url} target="_blank" rel="noopener noreferrer">{text}</Link>
					{:else}
						{text}
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
	{#if detail.teacherNotes}
		<div class="col-start-2"><TeacherNotes notes={detail.teacherNotes} /></div>
	{/if}
{/snippet}

{#snippet node(row: TaskNode)}
	{#if row.kind === 'heading'}
		<li>
			<details open>
				<summary class="cols cursor-pointer bg-background py-3 text-sm font-bold text-foreground">
					<span class="num"
						><span class="chev"><Icon path={mdiChevronRight} /></span>{row.number}</span
					>
					<span>{row.name}</span>
				</summary>
				{#if row.teacherNotes}
					<div class="cols bg-background pb-3">
						<div class="col-start-2"><TeacherNotes notes={row.teacherNotes} /></div>
					</div>
				{/if}
				<ol class="divide-y divide-border border-t border-border">
					{#each row.rows as child (child.id)}
						{@render node(child)}
					{/each}
				</ol>
			</details>
		</li>
	{:else}
		{@const hasBody = row.knowledge || row.skill || row.citations.length > 0 || row.teacherNotes}
		<li>
			<details open>
				<summary class="cols cursor-pointer py-4" class:pb-2={hasBody}>
					<span class="num"
						><span class="chev"><Icon path={mdiChevronRight} /></span>{row.number}</span
					>
					<span class="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-semibold text-foreground">
						{row.name}
						{#if row.optional}<Badge size="sm" variant="gray">Optional</Badge>{/if}
					</span>
				</summary>
				{#if hasBody}
					<div class="cols gap-y-2 pb-4">{@render detailCells(row)}</div>
				{/if}
			</details>
		</li>
	{/if}
{/snippet}

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
<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
		<span>Minimum grade {lp.minimum}</span>
	{/if}
</div>

{#if data.showsTeacherNotes}
	<TeacherNotesNotice />
{/if}

{#if lp.bodyHtml}
	<!-- Written by training staff in the CMS, whose rich-text editor produces this HTML. Full
	     width, as the panels below it are. -->
	<Prose as="div" class="mt-8 max-w-none">{@html lp.bodyHtml}</Prose>
{/if}

<!-- Each section below is its own block, so another can sit between any two. -->

{#if data.resources.length > 0}
	<Panel title="Resources" level={2} flush class="mt-10">
		<ul class="divide-y divide-border">
			{#each data.resources as resource (resource.id)}
				<li class="flex flex-col gap-2 px-4 py-4 sm:px-6">
					<span class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
						<Link href={resource.url} target="_blank" rel="noopener noreferrer"
							>{resource.title}</Link
						>
						{#if resource.teacherOnly}<Badge size="sm" variant="yellow">Teachers only</Badge>{/if}
					</span>
					{#if resource.note}
						<TeacherNotes notes={resource.note} label="Teacher note" />
					{/if}
				</li>
			{/each}
		</ul>
	</Panel>
{/if}

<section class="mt-10" aria-labelledby="tasks-heading" bind:this={taskList}>
	<div class="flex flex-wrap items-baseline gap-x-4 gap-y-2">
		<Heading level={2} id="tasks-heading">Tasks</Heading>
		{#if tasks.areas.length > 0}
			<span class="text-sm text-muted-foreground">
				{plural(tasks.count, 'task')}{tasks.optional > 0
					? `, ${tasks.optional} optional`
					: ', all required'}
			</span>
		{/if}
		{#if tasks.areas.length > 0}
			<span class="ml-auto flex gap-2">
				<Button variant="secondary" size="sm" onclick={() => foldAll(false)}>Close all</Button>
				<Button variant="secondary" size="sm" onclick={() => foldAll(true)}>Open all</Button>
			</span>
		{/if}
	</div>

	{#if tasks.areas.length === 0}
		<EmptyState size="inline" class="mt-4">This lesson plan has no tasks.</EmptyState>
	{/if}

	{#if tasks.areas.length > 1}
		<nav aria-label="Task areas" class="mt-4 flex flex-wrap gap-2 text-sm">
			{#each tasks.areas as area (area.number)}
				<a
					href="#area-{area.number}"
					onclick={() => openArea(`area-${area.number}`)}
					class="rounded-full border border-border bg-card px-3 py-1 text-link hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
				>
					{area.number}{area.name ? ` · ${area.name}` : ''}
				</a>
			{/each}
		</nav>
	{/if}

	{#each tasks.areas as area (area.number)}
		<details
			id="area-{area.number}"
			open
			class="mt-6 scroll-mt-4 overflow-hidden rounded-lg border border-border bg-card"
		>
			<summary
				class="flex cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-4 sm:px-6"
			>
				<span class="chev text-muted-foreground"><Icon path={mdiChevronRight} /></span>
				<span class="font-mono text-sm text-muted-foreground">{area.number}</span>
				{#if area.name}<Heading level={3} look={4}>{area.name}</Heading>{/if}
				<span class="ml-auto text-sm text-muted-foreground">{plural(area.count, 'task')}</span>
			</summary>
			<ol class="divide-y divide-border border-t border-border">
				{#if area.lead}
					<li class="cols gap-y-2 py-4">{@render detailCells(area.lead)}</li>
				{/if}
				{#each area.rows as row (row.id)}
					{@render node(row)}
				{/each}
			</ol>
		</details>
	{/each}
</section>

{#if data.scenarios.length > 0}
	<Panel title="Scenarios" level={2} flush class="mt-10">
		<ul class="divide-y divide-border">
			{#each data.scenarios as scenario (scenario.id)}
				<li class="px-4 sm:px-6">
					<Disclosure open={data.scenarios.length === 1}>
						{#snippet summary()}
							<span class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
								<span>{scenario.name}</span>
								{#if scenario.retired}<Retired />{/if}
								<span class="font-mono text-sm text-muted-foreground">{scenario.airport}</span>
							</span>
						{/snippet}
						<div class="flex flex-col gap-5 pb-5">
							<dl class="flex flex-wrap gap-x-10 gap-y-4">
								<div>
									<dt class="label">Airport</dt>
									<dd class="mt-1"><Airport airport={{ code: scenario.airport }} /></dd>
								</div>
								<div>
									<dt class="label">{data.showsTeacherNotes ? 'Student works' : 'You work'}</dt>
									<dd class="mt-1"><ScenarioPosition position={scenario.studentPosition} /></dd>
								</div>
								{#if scenario.teacherPosition}
									<div>
										<dt class="label">You work</dt>
										<dd class="mt-1"><ScenarioPosition position={scenario.teacherPosition} /></dd>
									</div>
								{/if}
							</dl>
							{#if scenario.description}
								<TeacherNotes notes={scenario.description} label="Teacher notes · setup" />
							{/if}
							{#if scenario.events}
								<div>
									<div class="flex flex-wrap items-baseline gap-2">
										<Heading level={3} look={4}>Events</Heading>
										<Badge size="sm" variant="yellow">Teachers only</Badge>
									</div>
									{#if scenario.events.length === 0}
										<p class="mt-2 text-sm text-muted-foreground">No events entered yet.</p>
									{:else}
										<ol class="mt-2 divide-y divide-border text-sm">
											{#each scenario.events as event (event.id)}
												<li class="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
													<Badge
														size="sm"
														variant={event.difficulty === 'easy'
															? 'green'
															: event.difficulty === 'medium'
																? 'orange'
																: 'red'}>{event.difficulty}</Badge
													>
													{#if event.callsign || event.aircraftType}
														<span class="font-mono text-foreground">
															{event.callsign}
															{#if event.aircraftType}<span class="text-muted-foreground"
																	>{event.aircraftType}</span
																>{/if}
														</span>
													{/if}
													<span class="basis-full whitespace-pre-line"
														>{event.description.trim()}</span
													>
												</li>
											{/each}
										</ol>
									{/if}
								</div>
							{/if}
							{#if scenario.atctrainer}
								<p class="text-sm">
									<span class="text-muted-foreground">ATCTrainer</span>
									{#if scenario.atctrainer.startsWith('https:')}
										<Link href={scenario.atctrainer} target="_blank" rel="noopener noreferrer"
											>Open the file</Link
										>
									{:else}
										<span class="font-mono">{scenario.atctrainer}</span>
									{/if}
								</p>
							{/if}
						</div>
					</Disclosure>
				</li>
			{/each}
		</ul>
	</Panel>
{/if}

{#if data.previous || data.next}
	<nav
		aria-label="Previous and next lesson plans"
		class="mt-10 flex flex-wrap justify-between gap-4 rounded-lg border border-border bg-card px-4 py-4 sm:px-6"
	>
		{#if data.previous}
			<Link href={lessonPlanHref(data.previous.id)}>
				‹ {data.previous.code}
				{data.previous.title}
			</Link>
		{:else}
			<span></span>
		{/if}
		{#if data.next}
			<Link href={lessonPlanHref(data.next.id)} class="ml-auto text-right">
				{data.next.code}
				{data.next.title} ›
			</Link>
		{/if}
	</nav>
{/if}

<style>
	/* The task list's two columns, the same on every row so they line up down the list. */
	.cols {
		display: grid;
		grid-template-columns: 5.5rem minmax(0, 1fr);
		column-gap: 1.25rem;
		padding-inline: 1rem;
	}
	@media (min-width: 40rem) {
		.cols {
			padding-inline: 1.5rem;
		}
	}
	.num,
	.label {
		text-align: right;
		color: var(--color-muted-foreground);
	}
	.num {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		font-weight: 400;
		white-space: nowrap;
	}
	.label {
		padding-top: 0.2rem;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
	dt.label {
		text-align: left;
	}
	summary {
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.chev {
		display: inline-flex;
		margin-right: 0.25rem;
		transition: transform 150ms;
	}
	details[open] > summary .chev {
		transform: rotate(90deg);
	}
	@media (prefers-reduced-motion: reduce) {
		.chev {
			transition: none;
		}
	}
</style>
