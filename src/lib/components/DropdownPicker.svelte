<script lang="ts" module>
	export interface DropdownElement {
		name: string;
		icon?: string;
		callback: (event: MouseEvent) => Promise<void | boolean> | void | boolean;
		class?: string | string[];
	}
</script>

<script lang="ts" generics="E extends DropdownElement">
	import type { Snippet } from "svelte";
	import DropdownButton from "./DropdownButton.svelte";

	let {
		elements,
		title = null,
		showTitle = true,
		icon: defaultIcon = null,
		swapIcon = true,
		expanded = $bindable(false),
		elementSnippet = null,
		buttonChildren = undefined,
		children = undefined,
		class: className = [],
		dropdownElement = $bindable<HTMLElement | null>(),
	}: {
		elements: E[];
		title?: string | null;
		showTitle?: boolean;
		icon?: string | null;
		swapIcon?: boolean;
		expanded?: boolean;
		elementSnippet?: Snippet<[E]> | null;
		buttonChildren?: Snippet;
		children?: Snippet;
		class?: string[] | string;
		dropdownElement?: HTMLElement | null;
	} = $props();

	let swappedIcon = $state(defaultIcon);
</script>

<DropdownButton
	bind:expanded
	bind:dropdownElement
	icon={swapIcon && defaultIcon ? swappedIcon : defaultIcon}
	label={title}
	showLabel={showTitle}
	class={className}
	{buttonChildren}
>
	<div
		class={[
			"flex flex-col",
			"[&>*]:even:bg-background-secondary",
			"[&>*]:odd:bg-background-tertiary",
			"[&>*]:hover:bg-background-selected",
		]}
	>
		{#each Object.values(elements) as element}
			<button
				class={["cursor-pointer text-nowrap select-none", element.class]}
				onclick={async (event) => {
					event.stopPropagation();
					const close = () => {
						expanded = false;
						if (element.icon) swappedIcon = element.icon;
					};
					// Only close after the callback returns successfully
					let result = element.callback(event);
					if (result instanceof Promise) {
						result = await result;
					}
					if (result !== false) close();

					// let result = element.callback(event);
					// if (result instanceof Promise) {
					// 	result = await result;
					// }
					// if (result === false) return;
				}}
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
