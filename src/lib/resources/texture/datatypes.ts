export interface Texture {
	id: string;
	fileName: string;
	dataUri: string;
}

export interface TextureInstance {
	glTexture: WebGLTexture;
	width: number;
	height: number;
}
