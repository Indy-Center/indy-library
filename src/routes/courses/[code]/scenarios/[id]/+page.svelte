<script lang="ts">
	import {
		Airport,
		Breadcrumbs,
		DescriptionList,
		PageHeader,
		Panel
	} from '@indy-center/centerline-svelte';
	import Retired from '$lib/components/Retired.svelte';
	import RowLink from '$lib/components/RowLink.svelte';
	import ScenarioPosition from '$lib/components/ScenarioPosition.svelte';
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
	{#if scenario.teacherPosition}
		<div>
			<dt>Teacher position</dt>
			<dd><ScenarioPosition position={scenario.teacherPosition} /></dd>
		</div>
	{/if}
</DescriptionList>

{#if data.showsTeacherNotes}
	<TeacherNotesNotice />
{/if}

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
