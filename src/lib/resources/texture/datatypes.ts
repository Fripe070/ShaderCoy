export interface Texture {
	name: string;
	dataUri: string;
}

export interface TextureInstance {
	glTexture: WebGLTexture;
}
