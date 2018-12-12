
precision lowp float;

@import ../shaders/facade.frag;


#if __VERSION__ == 100
    #define fragColor gl_FragColor
#else
    layout(location = 0) out vec4 fragColor;
#endif

//uniform float u_nearPlane;
//uniform float u_farPlane;

varying vec3 v_vertex;

float linearizeDepth(float depth, float near, float far)
{
    return (2 * near) / (far + near - depth * (far - near));
}


void main(void)
{
    float depth = linearizeDepth(gl_FragCoord.z, 3.0, 16.0);
    float dx = dFdx(depth);
    float dy = dFdy(depth);
    float moment = pow(depth, 2.0) + 0.25 * (dx*dx + dy*dy);

    fragColor = vec4(depth, moment, 0.0, 1.0);
}
