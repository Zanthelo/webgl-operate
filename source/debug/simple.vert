
precision lowp float;

@import ../shaders/facade.vert;


#if __VERSION__ == 100
    attribute vec3 a_vertex;
#else
    layout(location = 0) in vec3 a_vertex;
#endif

uniform mat4 u_viewProjection;
uniform mat4 u_lightViewProjection;
uniform mat4 u_model;

varying vec3 v_vertex;
varying vec4 v_shadowPosition;


void main()
{
    v_vertex = (u_model * vec4(a_vertex, 1.0)).xyz;
    v_shadowPosition = u_lightViewProjection * u_model * vec4(a_vertex, 1.0);
    gl_Position = u_viewProjection * u_model * vec4(a_vertex, 1.0);
}
