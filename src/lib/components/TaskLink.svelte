<!-- A task's number and name, one link to its page. -->
<script lang="ts">
	import { Link } from '@indy-center/centerline-svelte';

	let { task }: { task: { id: string; number: string; name: string } } = $props();
</script>

<Link href="/tasks/{task.id}" class="inline-flex items-baseline gap-2">
	<span class="font-mono text-sm">{task.number}</span>
	<span>{task.name}</span>
</Link>
