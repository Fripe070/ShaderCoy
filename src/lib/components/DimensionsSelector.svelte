<script lang="ts">
	import DynamicInput from "./DynamicInput.svelte";

	let { dimensions = $bindable() }: { dimensions: [number | null, number | null] } = $props();

	let widthString: string = $state(dimensions[0]?.toString() ?? "");
	let heightString: string = $state(dimensions[1]?.toString() ?? "");

	const MAX_DIMENSION = 10_000;
</script>

<div class="flex flex-row px-1">
	<DynamicInput
		bind:value={widthString}
		placeholder={/* sparkle emoji */ "\u2728"}
		maxWidth={140}
		class="text-end placeholder:text-foreground-primary/75"
		pattern="^([1-9][0-9]*)?$"
		oninput={(event) => {
			const inputElement = event.target as HTMLInputElement;
			const width = parseInt(inputElement.value);
			if (width > MAX_DIMENSION) {
				inputElement.setCustomValidity(`Width must be less than or equal to ${MAX_DIMENSION}.`);
			} else {
				inputElement.setCustomValidity("");
			}
			if (!isNaN(width) && width > 0 && inputElement.checkValidity()) {
				dimensions[0] = width;
			}
			if (inputElement.value === "") {
				dimensions[0] = null;
			}
		}}
		onchange={(event: Event) => {
			const inputElement = event.target as HTMLInputElement;
			if (!inputElement.checkValidity()) {
				widthString = dimensions[0]?.toString() ?? "";
				inputElement.setCustomValidity("");
			}
		}}
	/>
	<span class="px-0.5 text-foreground-muted">x</span>
	<DynamicInput
		bind:value={heightString}
		placeholder={/* sparkle emoji */ "\u2728"}
		class="text-start placeholder:text-foreground-primary/75"
		pattern="^([1-9][0-9]*)?$"
		oninput={(event) => {
			const inputElement = event.target as HTMLInputElement;
			const height = parseInt(inputElement.value);
			if (height > MAX_DIMENSION) {
				inputElement.setCustomValidity(`Height must be less than or equal to ${MAX_DIMENSION}.`);
			} else {
				inputElement.setCustomValidity("");
			}
			if (!isNaN(height) && height > 0 && inputElement.checkValidity()) {
				dimensions[1] = height;
			}
			if (inputElement.value === "") {
				dimensions[1] = null;
			}
		}}
		onchange={(event: Event) => {
			const inputElement = event.target as HTMLInputElement;
			if (!inputElement.checkValidity()) {
				heightString = dimensions[1]?.toString() ?? "";
				inputElement.setCustomValidity("");
			}
		}}
	/>
</div>
