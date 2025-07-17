/**
 * Test file to verify GLSL ES 3.0 syntax highlighting
 * This file contains various GLSL ES 3.0 constructs to test our custom parser
 */

// GLSL ES 3.0 Fragment shader example
const testFragmentShader = `
#version 300 es
precision highp float;

// Input from vertex shader
in vec3 vPosition;
in vec2 vTexCoord;
in vec3 vNormal;

// Output color
out vec4 fragColor;

// Uniforms
uniform sampler2D u_texture;
uniform samplerCube u_envMap;
uniform vec3 u_lightDirection;
uniform vec3 u_cameraPosition;
uniform float u_time;
uniform mat4 u_normalMatrix;

// Constants
const float PI = 3.14159265359;
const int MAX_LIGHTS = 8;

// Struct definition
struct Material {
    vec3 albedo;
    float metallic;
    float roughness;
    float ao;
};

struct Light {
    vec3 position;
    vec3 color;
    float intensity;
};

// Function declarations
vec3 calculateLighting(Material material, vec3 normal, vec3 viewDir, Light light);
float distributionGGX(vec3 N, vec3 H, float roughness);

void main() {
    // Sample textures
    vec4 albedoSample = texture(u_texture, vTexCoord);
    vec3 envColor = texture(u_envMap, reflect(-normalize(vPosition - u_cameraPosition), vNormal)).rgb;
    
    // Material setup
    Material material;
    material.albedo = albedoSample.rgb;
    material.metallic = 0.0;
    material.roughness = 0.5;
    material.ao = 1.0;
    
    // Lighting calculation
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(u_cameraPosition - vPosition);
    
    // Simple directional light
    Light light;
    light.position = u_lightDirection;
    light.color = vec3(1.0, 1.0, 0.9);
    light.intensity = 1.0;
    
    vec3 color = calculateLighting(material, normal, viewDir, light);
    
    // Add environment reflection
    color += envColor * 0.1;
    
    // Apply gamma correction
    color = pow(color, vec3(1.0/2.2));
    
    fragColor = vec4(color, 1.0);
}

// Helper functions
vec3 calculateLighting(Material material, vec3 normal, vec3 viewDir, Light light) {
    vec3 lightDir = normalize(light.position);
    vec3 halfwayDir = normalize(lightDir + viewDir);
    
    float NdotL = max(dot(normal, lightDir), 0.0);
    float NdotV = max(dot(normal, viewDir), 0.0);
    float NdotH = max(dot(normal, halfwayDir), 0.0);
    
    float D = distributionGGX(normal, halfwayDir, material.roughness);
    
    vec3 kS = mix(vec3(0.04), material.albedo, material.metallic);
    vec3 kD = (1.0 - kS) * (1.0 - material.metallic);
    
    vec3 numerator = D * kS;
    float denominator = 4.0 * NdotV * NdotL + 0.001;
    vec3 specular = numerator / denominator;
    
    return (kD * material.albedo / PI + specular) * light.color * light.intensity * NdotL;
}

float distributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    
    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
    
    return num / denom;
}
`;

export { testFragmentShader };