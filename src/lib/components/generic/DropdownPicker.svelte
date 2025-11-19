<script lang="ts" module>
	export interface DropdownElement {
		name: string;
		icon?: string;
		callback: (event: MouseEvent) => Promise<void> | void;
		class?: string | string[];
	}
</script>

<script lang="ts" generics="E extends DropdownElement">
	import type { Snippet } from "svelte";
	import DropdownButton from "./DropdownButton.svelte";
	import type { Placement } from "@floating-ui/dom";

	let {
		elements,
		elementSnippet = undefined,
		children,
		showing = $bindable(false),
		button = $bindable(undefined),
		...props
	}: {
		elements: E[];
		elementSnippet?: Snippet<[E]>;
		children: Snippet;
		placement?: Placement;
		showing?: boolean;
		button?: HTMLButtonElement;
		buttonChildren?: Snippet;
		label?: string | null;
		showLabel?: boolean;
		icon?: string | null;
	} = $props();
</script>

<DropdownButton bind:showing bind:button {...props}>
	<div
		class={[
			"flex flex-col",
			"*:even:bg-background-secondary",
			"*:odd:bg-background-tertiary",
			"*:hover:bg-background-selected",
		]}
	>
		{#each Object.values(elements) as element}
			<button
				class="{['cursor-pointer text-nowrap select-none', element.class]},"
				onclick={element.callback}
			>
				{#if elementSnippet}
					{@render elementSnippet(element)}
				{:else}
					<div class="flex flex-row items-center gap-1 px-1">
						{#if element.icon}
							<iconify-icon icon={element.icon}></iconify-icon>
						{/if}
						{#if element.name !== null}
							<span>{element.name}</span>
						{/if}
					</div>
				{/if}
			</button>
		{/each}
	</div>
	{#if children}
		{@render children()}
	{/if}
</DropdownButton>
