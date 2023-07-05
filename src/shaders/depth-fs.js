const shader = `

precision highp float;
#include <logdepthbuf_pars_fragment>
#include <packing>


uniform vec2 resolution;
uniform mat4 projectionInverse;

in vec2 vUv;

out vec4 color;

void main() {
    color = packDepthToRGBA(gl_FragCoord.z);

		#include <logdepthbuf_fragment>
}
`;

export { shader };

