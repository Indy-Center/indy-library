<!-- Teacher-only text in the yellow note style (decision 0076), shown only to readers the load
     lets see it. `label` names what it is. -->
<script lang="ts">
	let { notes, label = 'Teacher notes' }: { notes: string; label?: string } = $props();
</script>

<div class="rounded-sm border-l-4 border-warning bg-warning/10 px-4 py-3 text-sm">
	<span class="block text-xs font-bold tracking-wide text-muted-foreground uppercase">{label}</span>
	<p class="mt-1 whitespace-pre-line text-foreground-soft">{notes}</p>
</div>
