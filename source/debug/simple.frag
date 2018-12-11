
precision lowp float;

@import ../shaders/facade.frag;


#if __VERSION__ == 100
    #define fragColor gl_FragColor
#else
    layout(location = 0) out vec4 fragColor;
#endif

uniform sampler2D u_shadowTexture;

varying vec3 v_vertex;
varying vec4 v_shadowPosition;


void main(void)
{
    float visibility = 1.0;
    vec3 shadowPosition = v_shadowPosition.xyz / v_shadowPosition.w * 0.5 + 0.5;
    if (texture(u_shadowTexture, shadowPosition.xy).r < shadowPosition.z - 0.005)
    {
        visibility = 0.5;
    }
    vec4 basicColor = vec4(vec3(v_vertex.y * 0.5 + 0.5), 1.0);
    basicColor.r += visibility;
    fragColor = basicColor;
}
