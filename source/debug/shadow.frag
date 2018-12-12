
precision lowp float;

@import ../shaders/facade.frag;


#if __VERSION__ == 100
    #define fragColor gl_FragColor
#else
    layout(location = 0) out vec4 fragColor;
#endif

varying vec3 v_vertex;


void main(void)
{
    float dx = dFdx(gl_FragCoord.z);
    float dy = dFdy(gl_FragCoord.z);
    float moment = pow(gl_FragCoord.z, 2.0) + 0.25 * (dx*dx + dy*dy);

    fragColor = vec4(gl_FragCoord.z, moment, 0.0, 1.0);
}
