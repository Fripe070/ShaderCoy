import appIcon from "../assets/images/pwa_icon.png";
import { getImage } from "astro:assets";

export async function GET() {
    const icons = await Promise.all(
        [192, 512, 1024].map(async (size) => {
            const image = await getImage({
                src: appIcon,
                width: size,
                height: size,
                format: "png",
            });
            return {
                src: image.src,
                type: `image/${image.options.format}`,
                sizes: `${image.options.width}x${image.options.height}`,
            };
        }),
    );
    return new Response(
        JSON.stringify({
            short_name: "ShaderCoy",
            name: "ShaderCoy Shader Editor",
            description: "A GLSL shader editor",
            icons,
            display: "standalone",
            background_color: "#21252b",
        }),
        { headers: { "Content-Type": "application/json" } },
    );
}
