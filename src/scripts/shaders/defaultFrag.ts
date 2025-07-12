export default /* glsl */ `\
#version 300 es
precision mediump float;

in vec3 FragPosition;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec4 u_mouse;
uniform float u_time;
uniform float u_timeDelta;
uniform int u_frameNumber;

void main() {
    fragColor = vec4((FragPosition + 1.0) / 2.0, 1.0);
}
`;
