<!-- Whether a scenario is run live or on the sim. -->
<script lang="ts">
	import { Badge } from '@indy-center/centerline-svelte';

	let { mode }: { mode: 'live' | 'sim' } = $props();
</script>

<Badge size="sm" variant={mode === 'live' ? 'green' : 'sky'}>
	{mode === 'live' ? 'Live' : 'Sim'}
</Badge>
