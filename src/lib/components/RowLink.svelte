<!-- A row of a divided list that is one link to its page, edge to edge with an inset focus ring
     (a flush Panel or Card clips an outer one). `class` sets the row's padding and gaps. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	let {
		href,
		class: className = '',
		children,
		...rest
	}: HTMLAnchorAttributes & { href: string; class?: string; children: Snippet } = $props();
</script>

<a
	{href}
	class="flex items-baseline text-foreground transition-colors duration-200 hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring {className}"
	{...rest}
>
	{@render children()}
</a>
