import type { Component } from "svelte";
import FragmentTab from "./FragmentTab.svelte";
import TextureTab from "./TextureTab.svelte";
import VertexTab from "./VertexTab.svelte";

const tabs: Record<
	string,
	{
		component: Component;
		label: string;
		icon: string;
	}
> = {
	fragment: {
		component: FragmentTab,
		label: "Fragment",
		icon: "material-symbols:code",
	},
	vertex: {
		component: VertexTab,
		label: "Vertex",
		icon: "material-symbols:settings-ethernet",
	},
	texture: {
		component: TextureTab,
		label: "Texture",
		icon: "material-symbols:texture",
	},
};

export default tabs;
