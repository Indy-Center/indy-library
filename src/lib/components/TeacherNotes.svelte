<!-- A teacher note on a theory item or practical task, shown only to readers the load lets see it. -->
<script lang="ts">
	import { Badge, Icon } from '@indy-center/centerline-svelte';
	import { mdiHumanMaleBoard } from '@mdi/js';

	let { notes }: { notes: string } = $props();
</script>

<div class="mt-2 rounded-md bg-muted px-3 py-2 text-sm">
	<Badge size="sm" variant="purple">
		{#snippet icon()}<Icon path={mdiHumanMaleBoard} />{/snippet}
		Teacher notes
	</Badge>
	<p class="mt-1 whitespace-pre-line text-foreground-soft">{notes}</p>
</div>
