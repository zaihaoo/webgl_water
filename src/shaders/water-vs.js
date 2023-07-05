const shader = `
    precision highp float;

	#include <common>
	#include <logdepthbuf_pars_vertex>

    // in vec3 position;
    // in vec3 normal;
    // in vec2 uv;
    in vec4 tangent;

    // uniform mat3 normalMatrix;
    // uniform mat4 modelMatrix;
    // uniform mat4 modelViewMatrix;
    // uniform mat4 projectionMatrix;
    uniform float time;
    uniform vec3 lightDir;
    uniform float _Frequency;
    uniform float _Amplitude;
    uniform float _Speed;

    out vec2 vUv;
    out vec4 screenPos;
    out vec3 vTangent;
    out vec3 vNormal;
    out vec3 vBinormal;
    out vec3 vViewPos;
    out vec3 lightDirectionEC;


    vec4 ComputeScreenPos (vec4 pos)
    {
        float _ProjectionParams = 1.;
        vec4 o = pos * 0.5f;
        o.xy = vec2(o.x, o.y*_ProjectionParams) + o.w;
        o.zw = pos.zw;
        
        return o;
    }

    void main() {

        vec3 pos = position;

        float waveValue = sin(time/1000. * _Speed + pos.x *_Frequency)* _Amplitude;
        pos = vec3(pos.x, pos.y, pos.z + waveValue);

        vUv = uv;
        vec4 viewPosition = modelViewMatrix * vec4(pos, 1.);

        gl_Position = projectionMatrix * viewPosition;
        screenPos = ComputeScreenPos(gl_Position);

        vViewPos = viewPosition.xyz;
        vNormal = normalize(normalMatrix * normal);
        vTangent = normalize( normalMatrix * tangent.xyz );
        vBinormal = normalize(cross( vNormal, vTangent ) * tangent.w);
        lightDirectionEC = normalize((modelViewMatrix * vec4(lightDir,0.)).xyz);

		#include <logdepthbuf_vertex>
    }
`;

export { shader };