export default /* glsl */ `\
#version 300 es
precision mediump float;

in vec3 FragPosition;

out vec4 fragColor;

void main() {
    fragColor = vec4((FragPosition + 1.0) / 2.0, 1.0);
}
`;
