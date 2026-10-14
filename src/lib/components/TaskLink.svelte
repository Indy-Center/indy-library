<script lang="ts">
	let { task }: { task: { id: string; number: string; name: string } } = $props();
</script>

<a href="/tasks/{task.id}" class="group inline-flex items-baseline gap-2">
	<span class="font-mono text-sm text-sky-300">{task.number}</span>
	<span class="text-white group-hover:text-sky-200">{task.name}</span>
</a>
