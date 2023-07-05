const shader = `
precision highp float;

#include <common>
#include <logdepthbuf_pars_vertex>

// in vec3 position;
// in vec2 uv;

// uniform mat4 modelViewMatrix;
// uniform mat4 projectionMatrix;

out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	#include <logdepthbuf_vertex>
}
`;

export { shader };

