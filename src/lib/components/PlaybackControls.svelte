<script lang="ts">
	import { appState } from "$lib/state.svelte.js";

	let { frameDeltas }: { frameDeltas: number[] } = $props();

	let frameTime = $derived(frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length);
	let fps = $derived(frameTime === 0 ? 0 : 1 / frameTime);
</script>

<div class="flex h-full min-w-6 shrink flex-row bg-background-primary select-none">
	<button
		class={[
			"flex h-full w-6 cursor-pointer items-center justify-center ",
			appState.frontend.playing
				? "hover:bg-background-selected"
				: "bg-negative/10 hover:bg-negative/25",
		]}
		onclick={() => (appState.frontend.playing = !appState.frontend.playing)}
		aria-label={appState.frontend.playing ? "Pause" : "Play"}
	>
		<iconify-icon
			icon={appState.frontend.playing ? "material-symbols:pause" : "material-symbols:play-arrow"}
		></iconify-icon>
	</button>
	<div
		title="VSync is enabled. Values are averaged over frames."
		class={[
			"line-height-6 bg-background-secondary/50 text-nowrap select-text",
			"min-x-0 shrink overflow-x-hidden",
			(() => {
				if (!appState.frontend.playing) return "text-foreground-muted";
				if (fps >= 55) {
					return "text-positive";
				} else if (fps >= 30) {
					return "text-warning";
				}
				return "text-negative";
			})(),
		]}
	>
		<span class="px-2">
			{(frameTime * 1000).toFixed(0)}ms ({fps.toFixed(0)}&nbsp;FPS)
		</span>
	</div>
</div>
