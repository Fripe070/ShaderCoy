<script lang="ts">
	import { resolve } from "$app/paths";

	const title = "ShaderCoy";
	const description = "A web-based shader editor with a powerful live preview.";

	const favicon = resolve("/favicon.svg", {});
	const canonical = resolve("/", {});
</script>

<link rel="icon" type="image/svg+xml" href={favicon} />

<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />
<meta name="generator" content="SvelteKit" />
<meta name="keywords" content="shader, webgl, opengl, glsl, editor, graphics programming, 3D, 2D" />
<meta name="author" content="fripe" />

<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:type" content="website" />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={resolve("/preview.webp", {})} />
<meta property="og:image:type" content="image/webp" />
<meta property="og:image:alt" content="ShaderCoy Logo" />

<meta name="twitter:card" content="summary" />
<meta name="twitter:creator" content="@Fripe16" />

<meta name="color-scheme" content="dark light" />
<meta name="theme-color" content="#21252b" media="(prefers-color-scheme: dark)" />
<meta name="theme-color" content="#eaeaeb" media="(prefers-color-scheme: light)" />

<link rel="manifest" href={resolve("/manifest.webmanifest", {})} />
