
precision lowp float;

@import ../shaders/facade.frag;


#if __VERSION__ == 100
    #define fragColor gl_FragColor
#else
    layout(location = 0) out vec4 fragColor;
#endif

uniform sampler2D u_shadowTexture;
//uniform float u_nearPlane;
//uniform float u_farPlane;

varying vec3 v_vertex;
varying vec4 v_shadowPosition;

float hardShadowCompare(sampler2D depths, vec2 uv, float compare)
{
    float depth = texture(depths, uv).r;
    return step(compare, depth);
}

float linstep(float low, float high, float v)
{
    return clamp((v - low) / (high - low), 0.0, 1.0);
}

float VSMCompare(sampler2D depths, vec2 uv, float compare)
{
    vec2 moments = texture(depths, uv).xy;
    float p = smoothstep(compare - 0.02, compare, moments.x);
    float variance = max(moments.y - moments.x * moments.x, - 0.001);
    float d = compare - moments.x;
    float p_max = linstep(0.2, 1.0, variance / (variance + d*d));
    return clamp(max(p, p_max), 0.0, 1.0);
}

float linearizeDepth(float depth, float near, float far)
{
    return (2 * near) / (far + near - depth * (far - near));
}


void main(void)
{
    vec3 shadowPosition = v_shadowPosition.xyz / v_shadowPosition.w * 0.5 + 0.5;
    shadowPosition.z = linearizeDepth(shadowPosition.z, 3.0, 16.0);

    //float visibility = hardShadowCompare(u_shadowTexture, shadowPosition.xy, shadowPosition.z - 0.005);
    float visibility = VSMCompare(u_shadowTexture, shadowPosition.xy, shadowPosition.z - 0.005);

    float basicColor = clamp(1.0 - (v_vertex.y * 0.5 + 0.5), 0.25, 0.75);

    fragColor = vec4(vec3(basicColor * visibility), 1.0);
}
