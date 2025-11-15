<script lang="ts">
	import type { CoyErrorLogs } from "$lib/errors.js";

	let { errorLogs }: { errorLogs: CoyErrorLogs } = $props();
</script>

<div
	class={[
		"flex flex-col gap-1 p-1",
		"border border-negative",
		"bg-[color-mix(in_oklab,var(--theme-negative),var(--theme-background-secondary)90%)]",
	]}
>
	{#each errorLogs.shaderErrors as report}
		<div class="flex flex-col gap-0.5 bg-background-tertiary/50 p-1">
			<h2 class="font-bold">{report.cause}</h2>
			<div class="w-full border-t border-foreground-muted"></div>
			<p class="text-sm">{report.description}</p>
		</div>
	{/each}
</div>
