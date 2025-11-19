<script lang="ts">
	type InputEvent = Event & { currentTarget: EventTarget & HTMLInputElement };
	let {
		value = $bindable<string>(""),
		placeholder = "",
		class: className = "",
		...props
	}: {
		value?: string;
		placeholder?: string;
		oninput?: (event: InputEvent) => void;
		onchange?: (event: Event) => void;
		class?: string | string[];
		[key: string]: any;
	} = $props();

	let width: number = $state(0);
</script>

<div>
	<input
		bind:value
		{placeholder}
		type="text"
		style:width={`${width}px`}
		class={["all-unset placeholder:text-foreground-primary/75 invalid:text-negative", className]}
		{...props}
	/>
	<span bind:offsetWidth={width} class="invisible absolute left-0 whitespace-pre">
		{value || placeholder || ""}
	</span>
</div>
