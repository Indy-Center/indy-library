<script lang="ts">
	import { duration } from '$lib/format';
	import DraftBanner from '$lib/components/DraftBanner.svelte';
	import Retired from '$lib/components/Retired.svelte';
	import RowLink from '$lib/components/RowLink.svelte';
	import {
		Badge,
		Button,
		Chip,
		Credential,
		DescriptionList,
		EmptyState,
		Icon,
		Link,
		PageHeader,
		Panel,
		Text
	} from '@indy-center/centerline-svelte';
	import { mdiClipboardCheckOutline, mdiClockOutline } from '@mdi/js';

	let { data } = $props();
	// Pages beneath a draft stay on the draft.
	let hasFacts = $derived(
		data.facts.prerequisites.length > 0 ||
			Boolean(data.facts.prerequisitesNote) ||
			Boolean(data.facts.credentialIssued) ||
			Boolean(data.facts.academyExam) ||
			Boolean(data.facts.estimatedWeeks) ||
			Boolean(data.facts.consolidation) ||
			Boolean(data.facts.ratingExam) ||
			Boolean(data.facts.moodleUrl)
	);
	let q = $derived(data.version.isDraft ? '?version=draft' : '');
</script>

<svelte:head>
	<title>{data.course.code} {data.course.title} | Library | Indy Center</title>
</svelte:head>

{#if data.version.isDraft}
	<DraftBanner
		number={data.version.number}
		currentHref={data.hasCurrent ? `/courses/${data.course.code}` : null}
	/>
{/if}

<div class="font-mono text-sm text-muted-foreground">{data.course.code}</div>
<PageHeader title={data.course.title}>
	{#if data.version.description}{data.version.description}{/if}
	{#snippet actions()}
		{#if data.draft !== null}
			<Button variant="secondary" size="sm" href="/courses/{data.course.code}?version=draft">
				Read the draft, edition {data.draft}
			</Button>
		{/if}
	{/snippet}
</PageHeader>

<div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
	<span>Edition {data.version.number}</span>
	{#if data.version.time}
		<span class="flex items-center gap-1">
			<Icon path={mdiClockOutline} />
			{duration(data.version.time)}
		</span>
	{/if}
</div>

{#snippet credential(c: (typeof data.facts.prerequisites)[number][number])}
	{#if c.name !== null && c.kind !== null}<Credential
			code={c.code}
			name={c.name}
			kind={c.kind}
			focusable
		/>{:else}<Chip>{c.code}</Chip>{/if}{#if c.retired}{' '}<Retired />{/if}
{/snippet}

<!-- The course facts block. Each row shows only when its fact is set; with no row, no block.
	Rows follow the CMS Details tab's order. -->
{#if hasFacts}
	<DescriptionList class="mt-6">
		{#if data.facts.prerequisites.length > 0 || data.facts.prerequisitesNote}
			<div>
				<dt>To enrol you need</dt>
				{#each data.facts.prerequisites as row, r (r)}
					<dd>
						{#each row as c, i (c.code)}
							{#if i > 0}{', or '}{/if}{@render credential(c)}
						{/each}
					</dd>
				{/each}
				{#if data.facts.prerequisitesNote}<dd>{data.facts.prerequisitesNote}</dd>{/if}
			</div>
		{/if}
		{#if data.facts.academyExam}
			<div>
				<dt>Before you start</dt>
				<dd>VATUSA Academy {data.facts.academyExam} exam</dd>
			</div>
		{/if}
		{#if data.facts.estimatedWeeks}
			{@const weeks = data.facts.estimatedWeeks}
			<div>
				<dt>Estimated length</dt>
				<dd>
					{weeks.min === weeks.max ? `${weeks.min} weeks` : `${weeks.min}–${weeks.max} weeks`}
				</dd>
			</div>
		{/if}
		{#if data.facts.consolidation}
			<div>
				<dt>Consolidation</dt>
				<dd>
					{data.facts.consolidation.hours} hours on {data.facts.consolidation.positionTypes.join(
						' or '
					)}
				</dd>
			</div>
		{/if}
		{#if data.facts.ratingExam}
			<div>
				<dt>Ends in</dt>
				<dd>the {data.facts.ratingExam} rating exam</dd>
			</div>
		{/if}
		{#if data.facts.credentialIssued}
			<div>
				<dt>Finishing earns</dt>
				<dd>{@render credential(data.facts.credentialIssued)}</dd>
			</div>
		{/if}
		{#if data.facts.moodleUrl}
			<div>
				<dt>Taken on</dt>
				<dd><Link href={data.facts.moodleUrl}>Moodle</Link></dd>
			</div>
		{/if}
	</DescriptionList>
{/if}

{#each data.modules as module, i (module.id)}
	<Panel title="Module {i + 1} · {module.title}" level={2} flush class="mt-8">
		{#if module.description}
			<Text size="small" class="px-4 py-3">{module.description}</Text>
		{/if}
		<ol class="divide-y divide-border">
			{#each module.lessonPlans as lp (lp.id)}
				<li>
					<RowLink
						href="/courses/{data.course.code}/lesson-plans/{lp.id}{q}"
						class="flex-wrap gap-x-4 gap-y-1 px-4 py-3"
					>
						<span class="w-20 shrink-0 font-mono text-sm text-foreground-soft">{lp.code}</span>
						<span class="flex-1 font-medium text-foreground">{lp.title}</span>
						{#if lp.isExam}
							<Badge variant="orange" size="sm">
								{#snippet icon()}<Icon path={mdiClipboardCheckOutline} />{/snippet}
								Exam
							</Badge>
						{/if}
						{#if lp.time}
							<span class="text-sm text-muted-foreground">{duration(lp.time)}</span>
						{/if}
					</RowLink>
				</li>
			{/each}
		</ol>
	</Panel>
{:else}
	<EmptyState title="No modules yet" level={2} class="mt-8">
		This edition has no modules yet.
	</EmptyState>
{/each}

{#if data.version.completionStandard}
	<Panel title="Completion standard" level={2} class="mt-8">
		<p class="whitespace-pre-line">{data.version.completionStandard}</p>
	</Panel>
{/if}
