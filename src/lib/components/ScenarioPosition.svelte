<!-- A scenario's position on one line, in Centerline's controllers' preset, marked when retired.
     A position the catalogue lacks shows its callsign alone. -->
<script lang="ts">
	import { Position } from '@indy-center/centerline-svelte';
	import type { ShownPosition } from '$lib/positions';
	import Retired from './Retired.svelte';

	let { position }: { position: ShownPosition } = $props();
</script>

<span class="inline-flex flex-wrap items-baseline gap-2">
	<Position callsign={position.callsign} positionId={position.id} layout="inline" />
	{#if position.retired}<Retired />{/if}
</span>
