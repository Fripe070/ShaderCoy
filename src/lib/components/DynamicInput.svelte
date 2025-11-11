<script lang="ts">
	import { onMount } from "svelte";

	let {
		value = $bindable<string>(""),
		defaultWidth = 40,
		minWidth = 40,
		maxWidth = undefined,
		padding = 0,
		oninput = () => {},
		class: className = "",
		...props
	}: {
		value?: string;
		defaultWidth?: number;
		minWidth?: number;
		maxWidth?: number | undefined;
		padding?: number;
		oninput?: (event: Event) => void;
		class?: string | string[];
		[key: string]: any;
	} = $props();

	let sizeAdjuster: HTMLElement;
	let input: HTMLInputElement;

	function sizeToFit(text: string) {
		sizeAdjuster.innerText = text;
		input.style.width = `${sizeAdjuster.offsetWidth + padding}px`;
	}
	$effect(() => {
		sizeToFit(value || input.placeholder);
	});
	onMount(() => {
		sizeToFit(value || input.placeholder);
	});
</script>

<div style:max-width={maxWidth ? `${maxWidth}px` : undefined} class="overflow-x-auto">
	<input
		bind:this={input}
		type="text"
		class={["all-unset invalid:text-negative", className]}
		style:width={`${defaultWidth}px`}
		style:min-width={`${minWidth}px`}
		oninput={(event) => {
			oninput(event);
			sizeToFit(input.value || input.placeholder);
			input.reportValidity();
		}}
		bind:value
		{...props}
	/>
	<span bind:this={sizeAdjuster} class="invisible absolute whitespace-pre"> </span>
</div>
