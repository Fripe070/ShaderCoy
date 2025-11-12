<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		children,
		buttonChildren = undefined,
		label = null,
		showLabel = true,
		icon = null,
		side = "left",
		expanded = $bindable(false),
		class: className = [],
		dropdownElement = $bindable<HTMLElement | null>(),
	}: {
		children: Snippet;
		buttonChildren?: Snippet;
		label?: string | null;
		showLabel?: boolean;
		icon?: string | null;
		side?: "left" | "right";
		expanded?: boolean;
		class?: string[] | string;
		dropdownElement?: HTMLElement | null;
	} = $props();

	let mainElement: HTMLElement | null = $state(null);
</script>

<svelte:body
	onclick={(event: MouseEvent) => {
		const contains = mainElement?.contains(event.target as Node);
		if (contains) {
			event.stopPropagation();
			return;
		}
		expanded = false;
	}}
/>

<div
	bind:this={mainElement}
	class={["relative select-none", className]}
	role="button"
	tabindex="0"
	onclick={() => {
		expanded = true;
	}}
	onkeydown={(event) => {
		if (event.key === "Enter" || event.key === " ") {
			expanded = !expanded;
		}
	}}
>
	<span
		class={[
			"relative flex h-6 cursor-pointer items-center justify-center gap-1 px-1",
			"bg-background-primary hover:bg-background-selected",
		]}
		title={showLabel ? undefined : label}
	>
		{#if icon}
			<iconify-icon {icon}></iconify-icon>
		{/if}
		{#if label && showLabel}
			<span class="max-w-50 min-w-0 shrink overflow-hidden">{label}</span>
		{/if}
		{#if buttonChildren}
			{@render buttonChildren()}
		{/if}
	</span>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={dropdownElement}
		class={[
			"absolute top-full bg-background-primary",
			expanded ? "block" : "hidden",
			side === "right" ? "left-0" : "right-0",
		]}
		onclick={(event) => {
			event.stopPropagation();
		}}
	>
		{@render children()}
	</div>
</div>
