<script lang="ts" module>
	let dropdownIdCounter: number = 0;
</script>

<script lang="ts">
	import { autoUpdate, computePosition, flip, shift, size, type Placement } from "@floating-ui/dom";
	import { type Snippet } from "svelte";

	let {
		children,
		buttonChildren = undefined,
		label = null,
		showLabel = true,
		icon = null,
		placement = "bottom-start",
		showing = $bindable(false),
		button = $bindable(undefined),
	}: {
		children: Snippet;
		buttonChildren?: Snippet;
		label?: string | null;
		showLabel?: boolean;
		icon?: string | null;
		placement?: Placement;
		showing?: boolean;
		button?: HTMLButtonElement;
	} = $props();

	const elementId = `dropdown-popover-${++dropdownIdCounter}`;
	let dropdown: HTMLDivElement;

	let top: number = $state(0);
	let left: number = $state(0);
	let maxHeight: number = $state(0);

	$effect(() => {
		if (!button || !dropdown) return;
		if (!showing) return;
		return autoUpdate(button, dropdown, () => {
			if (!button || !dropdown) return;
			computePosition(button, dropdown, {
				placement: placement,
				middleware: [
					flip(),
					shift(),
					size({
						apply({ availableHeight }) {
							maxHeight = Math.max(0, availableHeight);
						},
					}),
				],
			}).then(({ x, y }) => {
				top = y;
				left = x;
			});
		});
	});

	$effect(() => {
		if (!dropdown) return;
		if (showing) {
			dropdown.showPopover();
		} else {
			dropdown.hidePopover();
		}
	});
</script>

<button
	bind:this={button}
	class={[
		"relative flex h-6 min-w-6 cursor-pointer items-center justify-center gap-1 px-1",
		"bg-background-primary hover:bg-background-selected",
	]}
	title={showLabel ? undefined : label}
	popovertarget={elementId}
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
</button>

<div
	bind:this={dropdown}
	style:top={`${top}px`}
	style:left={`${left}px`}
	style:max-height={`${maxHeight}px`}
	class="all-[unset] absolute w-max bg-background-primary text-[unset]"
	id={elementId}
	popover
	ontoggle={(event) => {
		showing = event.newState == "open";
	}}
>
	{@render children()}
</div>
