<script lang="ts">
	import {
		Badge,
		Card,
		EmptyState,
		Heading,
		Icon,
		PageHeader
	} from '@indy-center/centerline-svelte';
	import { mdiSchool } from '@mdi/js';

	let { data } = $props();
</script>

<svelte:head>
	<title>Library | Indy Center</title>
</svelte:head>

<PageHeader title="Courses">The current edition of every Indy Center course.</PageHeader>

{#if data.courses.length === 0}
	<EmptyState title="No courses yet" level={2} class="mt-8">
		No course has been published yet.
	</EmptyState>
{:else}
	<ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.courses as course (course.code)}
			<Card as="li">
				<!-- The link fills the card (negative margin cancels its padding), so its focus ring reaches the card's edges. -->
				<a
					href={course.hasCurrent
						? `/courses/${course.code}`
						: `/courses/${course.code}?version=draft`}
					class="-m-4 block h-[calc(100%+2rem)] rounded-lg p-4 hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
				>
					<div class="flex items-center gap-2 font-mono text-sm">
						<Icon path={mdiSchool} />
						{course.code}
					</div>
					<Heading level={2} look={3} class="mt-2">{course.title}</Heading>
					{#if course.draft !== null}
						<Badge variant="yellow" pill size="sm" class="mt-3">
							{course.hasCurrent ? `Draft edition ${course.draft} in progress` : 'Draft only'}
						</Badge>
					{/if}
				</a>
			</Card>
		{/each}
	</ul>
{/if}
