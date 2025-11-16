import type { Texture, TextureInstance } from "./datatypes.js";

async function loadImage(texture: Texture): Promise<HTMLImageElement> {
	return await new Promise<HTMLImageElement>((resolve, reject) => {
		const image = new Image();
		image.src = texture.dataUri;
		image.onload = () => resolve(image);
		image.onerror = (error) => reject(error);
	});
}

// TODO: Allow configuring in textures panel
export async function loadTexture2D(
	glCtx: WebGL2RenderingContext,
	texture: Texture,
): Promise<TextureInstance> {
	const image = await loadImage(texture);

	const textureInstance = glCtx.createTexture();
	if (!textureInstance) throw new Error("Failed to create texture");
	glCtx.bindTexture(glCtx.TEXTURE_2D, textureInstance);
	glCtx.pixelStorei(glCtx.UNPACK_FLIP_Y_WEBGL, true); // Flip Y axis
	glCtx.texImage2D(glCtx.TEXTURE_2D, 0, glCtx.RGBA, glCtx.RGBA, glCtx.UNSIGNED_BYTE, image);

	const isPowerOf2 = (value: number) => (value & (value - 1)) === 0;
	if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
		glCtx.generateMipmap(glCtx.TEXTURE_2D);
		glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.LINEAR_MIPMAP_LINEAR);
	} else {
		glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MIN_FILTER, glCtx.LINEAR);
	}
	glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_MAG_FILTER, glCtx.LINEAR);
	glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_S, glCtx.REPEAT);
	glCtx.texParameteri(glCtx.TEXTURE_2D, glCtx.TEXTURE_WRAP_T, glCtx.REPEAT);

	console.debug("Loaded texture:", texture.fileName, "with size", image.width, "x", image.height);
	return {
		glTexture: textureInstance,
		width: image.width,
		height: image.height,
	};
}
