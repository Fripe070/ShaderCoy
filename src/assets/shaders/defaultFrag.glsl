#version 300 es
precision mediump float;

in vec3 FragPosition;
in vec3 Normal;
in vec2 TexCoord;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec4 u_mouse;
uniform float u_time;
uniform float u_deltaTime;
uniform int u_frameNumber;

uniform sampler2D u_textures[8];

void main() {
    // Show the texture coordinates (UV mapping)!
    // fragColor = vec4(TexCoord.xy, 0.0, 1.0);

    // Perhaps show the fragment's position!
    // fragColor = vec4((FragPosition + 1.0) / 2.0, 1.0);

    // Or sample a texture!
    // vec4 color = texture(u_textures[0], TexCoord);
    // fragColor = vec4(color.rgb, 1.0);

    // Simple normal-based lighting
    vec3 lightDir = normalize(vec3(cos(u_time), 1.0, sin(u_time)));
    vec3 colour = vec3(0.4, 0.6, 0.8);
    
    float diff = max(dot(Normal, lightDir), 0.0);
    vec3 diffuse = diff * colour;
    vec3 ambient = 0.2 * colour;
    fragColor = vec4(ambient + diffuse, 1.0);
}
