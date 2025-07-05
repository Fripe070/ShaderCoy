export default /* glsl */ `\
#version 300 es

in vec4 a_position;
in vec3 a_normal;
in vec2 a_texCoord;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_modelMatrix;

void main() {
    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * a_position;
}
`;
