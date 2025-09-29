import type { WebGLCtx } from "@/scripts/utils";
import type { TextureData } from "./datatypes";

// TODO: Allow configuring in textures panel
export function loadTexture2D(glCtx: WebGLCtx, image: HTMLImageElement): TextureData {
    const texture = glCtx.createTexture();
    if (!texture) throw new Error("Failed to create texture");
    glCtx.bindTexture(glCtx.TEXTURE_2D, texture);
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

    return { name: image.src, imageUri: image.src, glTexture: texture };
}
