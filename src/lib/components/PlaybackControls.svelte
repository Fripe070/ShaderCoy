<script lang="ts">
	import { appState } from "$lib/state.svelte.js";
	import { isSmallScreen } from "$lib/utils.svelte.js";
	import { MediaQuery } from "svelte/reactivity";

	let { frameDeltas }: { frameDeltas: number[] } = $props();

	let frameTime = $derived(frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length);
	let fps = $derived(frameTime === 0 ? 0 : 1 / frameTime);

	const tooSmallVertical = new MediaQuery("max-width: 28rem");
	const tooSmallHorizontal = new MediaQuery("max-width: 55rem");

	let isTooSmall = $derived.by(() => {
		if (isSmallScreen()) return tooSmallVertical.current;
		else return tooSmallHorizontal.current;
	});
</script>

<div class="flex h-6 min-w-6 shrink flex-row bg-background-primary select-none">
	<button
		class={[
			"flex h-6 w-6 cursor-pointer items-center justify-center ",
			appState.frontend.playing
				? "hover:bg-background-selected"
				: "bg-negative/10 hover:bg-negative/25",
		]}
		onclick={() => (appState.frontend.playing = !appState.frontend.playing)}
		title={appState.frontend.playing ? "Pause" : "Play"}
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
			{(frameTime * 1000).toFixed(0)}ms
			{#if !isTooSmall}
				({fps.toFixed(0)}&nbsp;FPS)
			{/if}
		</span>
	</div>
</div>
