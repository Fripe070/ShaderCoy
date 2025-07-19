export default /* glsl */ `\
#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_texCoord;

out vec3 FragPosition;
out vec3 Normal;
out vec2 TexCoord;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_modelMatrix;

void main() {
    FragPosition = (u_modelMatrix * vec4(a_position, 1.0)).xyz;
    gl_Position = u_projectionMatrix * u_viewMatrix * vec4(FragPosition, 1.0);
    
    Normal = a_normal;
    TexCoord = a_texCoord;
}
`;
