#version 300 es
precision mediump float;

in vec3 FragPosition;
in vec3 Normal;
in vec2 TexCoord;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec4 u_mouse;
uniform float u_time;
uniform float u_timeDelta;
uniform int u_frameNumber;

uniform sampler2D u_textures[8];

void main() {
    // fragColor = vec4((FragPosition + 1.0) / 2.0, 1.0);
    vec4 color = texture(u_textures[0], TexCoord);
    fragColor = vec4(color.rgb, 1.0);
    fragColor = vec4(TexCoord.xy, 0.0, 1.0);
}
