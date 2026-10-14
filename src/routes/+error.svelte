<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="rounded-lg border border-slate-700/60 bg-slate-800/60 p-8 text-center text-white">
	<h1 class="text-2xl font-semibold">{page.status}</h1>
	<p class="mt-2 text-gray-300">{page.error?.message}</p>
	<a href="/" class="mt-6 inline-block text-sm text-sky-300 hover:text-sky-200">Back to courses</a>
</div>
