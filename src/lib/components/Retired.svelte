<!-- Marks a task, competency, scenario, position or credential that is retired: a state, so a pill. -->
<script lang="ts">
	import { Badge } from '@indy-center/centerline-svelte';

	let { class: className = '' }: { class?: string } = $props();
</script>

<Badge size="sm" variant="gray" pill class={className}>Retired</Badge>
