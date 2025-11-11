<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		first,
		second,
		direction = "horizontal",
		draggable = true,
		factor = $bindable(0.5),
		firstMinSize = 0,
		secondMinSize = 0,
	}: {
		first: Snippet;
		second: Snippet;
		direction?: "horizontal" | "vertical";
		draggable?: boolean;
		factor?: number;
		firstMinSize?: number;
		secondMinSize?: number;
	} = $props();

	let dragging = $state(false);
	let container: HTMLDivElement;

	$effect(() => {
		factor = Math.min(factor, 1 - secondMinSize);
		factor = Math.max(factor, firstMinSize);
	});
</script>

<svelte:window
	onmouseup={() => (dragging = false)}
	onmousemove={(event) => {
		if (!dragging) return;

		factor =
			direction === "vertical"
				? (event.clientY - container.getBoundingClientRect().top) / container.clientHeight
				: (event.clientX - container.getBoundingClientRect().left) / container.clientWidth;
	}}
/>

<div
	class={["flex h-full w-full overflow-hidden", direction === "vertical" ? "flex-col" : "flex-row"]}
	bind:this={container}
>
	<div class="shrink basis-0 overflow-hidden" style:flex-grow={factor}>
		{@render first()}
	</div>
	{#if draggable}
		<div class={["relative", direction === "vertical" ? "w-full" : "h-full"]}>
			<div
				class={[
					"absolute z-50 flex items-center justify-center",
					direction === "vertical"
						? "top-1/2 h-[var(--bar-size)] w-full -translate-y-1/2"
						: "left-1/2 h-full w-[var(--bar-size)] -translate-x-1/2",
					"text-current/50 hover:bg-current/25 hover:text-current",
					direction === "vertical"
						? dragging
							? "cursor-row-resize"
							: "cursor-ns-resize"
						: dragging
							? "cursor-col-resize"
							: "cursor-ew-resize",
				]}
				style:--bar-size="calc(var(--size,calc(var(--spacing,1rem)*2)))"
				role="button"
				tabindex="0"
				onmousedown={(event) => {
					event.preventDefault();
					event.stopPropagation();
					dragging = true;
				}}
			>
				<iconify-icon
					icon="material-symbols:drag-handle"
					class={[
						"flex items-center justify-center",
						"text-[calc(var(--bar-size)*2)]",
						direction === "vertical" ? "rotate-0" : "rotate-90",
					]}
				></iconify-icon>
			</div>
		</div>
	{/if}
	<div class="shrink basis-0 overflow-hidden" style:flex-grow={1 - factor}>
		{@render second()}
	</div>
</div>
