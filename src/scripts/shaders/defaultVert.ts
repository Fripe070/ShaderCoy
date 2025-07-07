export default /* glsl */ `\
#version 300 es

in vec3 a_position;

out vec3 FragPosition;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_modelMatrix;

void main() {
    FragPosition = (u_modelMatrix * vec4(a_position, 1.0)).xyz;
    gl_Position = u_projectionMatrix * u_viewMatrix * vec4(FragPosition, 1.0);
}
`;
