<script lang="ts">
	import DynamicInput from "./DynamicInput.svelte";

	let {
		allowNulls = false,
		width = $bindable(0),
		height = $bindable(0),
		minAxisSize = 1,
		maxAxisSize,
	}: {
		minAxisSize?: number;
		maxAxisSize?: number;
	} & (
		| {
				allowNulls?: false;
				width: number;
				height: number;
		  }
		| {
				allowNulls: true;
				width: number | null;
				height: number | null;
		  }
	) = $props();

	const dimensionProxy = {
		get width() {
			return width?.toString() ?? "";
		},
		set width(value: string) {
			const numValue = value.replace(/\D/g, "");
			const result = numValue ? parseInt(numValue) : null;
			// prettier-ignore
			width = result == null
				? (allowNulls ? null : 0)
				: Math.max(minAxisSize ?? -Infinity, Math.min(result, maxAxisSize ?? Infinity));
		},
		get height() {
			return height?.toString() ?? "";
		},
		set height(value: string) {
			const numValue = value.replace(/\D/g, "");
			const result = numValue ? parseInt(numValue) : null;
			// prettier-ignore
			height = result == null
				? (allowNulls ? null : 0)
				: Math.max(minAxisSize ?? -Infinity, Math.min(result, maxAxisSize ?? Infinity));
		},
	};
</script>

<div class="flex flex-row">
	<DynamicInput
		bind:value={dimensionProxy.width}
		placeholder={allowNulls ? /* sparkle emoji */ "\u2728" : ""}
		class="min-w-6 text-end"
	/>
	<span class="px-0.5 text-foreground-muted">x</span>
	<DynamicInput
		bind:value={dimensionProxy.height}
		placeholder={allowNulls ? /* sparkle emoji */ "\u2728" : ""}
		class="min-w-6 text-start"
	/>
</div>
