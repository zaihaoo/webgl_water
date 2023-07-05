const shader = `
    precision highp float;
	#include <logdepthbuf_pars_fragment>
    #include <packing>

    uniform sampler2D depthBuffer;
    uniform sampler2D foamTexture;
    uniform sampler2D normalTexture;
    uniform vec2 resolution;
    uniform float time;
    uniform mat4 projectionInverse;
    uniform vec3 lightColor;
    uniform vec3 lightDir;

    uniform float near;
    uniform float far;
    uniform float _WaterSpecular;
    uniform float _WaterSmoothness;
    uniform float _NormalScale;
    uniform vec4 _WaveParams;
    uniform float _RimPower;
    uniform vec3 deepColor;
    uniform vec3 shalowColor;
    uniform float _FoamDepth;
    uniform vec4 _FoamOffset;
    uniform float _FoamFactor;
    uniform vec3 _FoamColor;
    uniform vec3 _DetailColor;
    uniform float _WaterWave;
    uniform float _AlphaWidth;


    in vec2 vUv;
    in vec4 screenPos;
    in vec3 vTangent;
    in vec3 vNormal;
    in vec3 vBinormal;
    in vec3 vViewPos;
    in vec3 lightDirectionEC;

    out vec4 color;

    // x = 1-far/near
    // y = far/near
    // z = x/far
    // w = y/far

    float LinearEyeDepth( float z, vec4 _ZBufferParams)
    {
        return 1.0 / (_ZBufferParams.z * z + _ZBufferParams.w);
    }

    vec3 BlendNormals(vec3 n1, vec3 n2)
    {
        return normalize(vec3(n1.xy + n2.xy, n1.z*n2.z));
    }

    vec3 UnpackNormal(vec4 normal) {
        return normal.xyz * 2. - 1.;
    }


    void main() {

        // Create TBN matrix
        mat3 tbn = mat3(vTangent, vBinormal, vNormal);

        vec2 uv = gl_FragCoord.xy / resolution;
        vec4 foamColor = texture(foamTexture, vUv);

        float _Time = time/1000.;
        vec4 _ZBufferParams = vec4(1.-far/near,far/near,(1.-far/near)/far,(far/near)/far);
        
        vec2 panner1 = fract( _Time * _WaveParams.xy + vUv);
        vec2 panner2 = fract( _Time * _WaveParams.zw + vUv);
        vec3 normalEC = BlendNormals(UnpackNormal(texture( normalTexture, panner1)) , UnpackNormal(texture(normalTexture, panner2)));
        normalEC = mix(vec3(0., 0., 1.), normalEC, _NormalScale);
        normalEC = normalize(tbn * normalEC);
        //todo: 这里是否需要blend一下光照方向 不然白天和夜晚没有区别
        vec3 viewDirEC = normalize(-vViewPos);



        float diffuse = max(dot(viewDirEC, normalEC), 0.0);


        float _WaterGloss = _WaterSmoothness * 256.;
        // vec3 lightDirectionEC = normalize((vViewMatrix * vec4(lightDir,0.)).xyz);
        // vec3 lightDirectionEC = normalize(lightDirEC);
        



        // color.rgb = lightDirectionEC;
        // color.a = 1.;
        // return;





        // color.rgb = abs(lightDirectionEC);

        // vec3 lightDirectionEC = lightDirEC;

        vec3 halfDirEC = normalize(lightDirectionEC + viewDirEC);
        vec3 specular = lightColor * _WaterSpecular * pow(max(0., dot(normalEC, halfDirEC)), _WaterGloss);


        vec3 rim = pow(1.-clamp(diffuse,0.,1.),_RimPower)*lightColor;

        vec3 waterColor = mix(shalowColor,deepColor,foamColor.r);
        color.rgb = waterColor;






























        float depthMask;
        float eyeDepthSubScreenPos;
        vec4 packedDepth = texture(depthBuffer, uv);
        if (packedDepth.rgb == vec3(0.)) {
            depthMask = 0.;
            eyeDepthSubScreenPos = 1.+_FoamDepth;
        }else{
            // 解码之后原来没有没有深度的地方 不会复原为0 也就是说unpack之后 vec3(0.)不会为0 算法的问题? 值都非常接近1
            float sceneDepth = unpackRGBAToDepth(packedDepth);

            sceneDepth = LinearEyeDepth(sceneDepth,_ZBufferParams);
            eyeDepthSubScreenPos = abs( sceneDepth - screenPos.w );
            depthMask = 1.-eyeDepthSubScreenPos + _FoamDepth;
        }



        // viewport->eyeView
        // vec4 sceneNdc = vec4((gl_FragCoord.xy/resolution)*2.-1.,sceneDepth*2.-1.,1.);
        // vec4 sceneEye = projectionInverse*sceneNdc;
        // sceneEye = sceneEye/sceneEye.w;

        // vec4 waterNdc = vec4((gl_FragCoord.xy/resolution)*2.-1.,gl_FragCoord.z*2.-1.,1.);
        // vec4 waterEye = projectionInverse*waterNdc;
        // waterEye = waterEye/waterEye.w;

        

        // if (packedDepth.rgb == vec3(0.)) {
        //     color = vec4(1.);
        // }else{
        //     color = vec4(vec3(abs(waterEye.z - sceneEye.z)),1.);
        // }




        vec4 foam1 = texture(foamTexture, vUv + normalEC.xy * _FoamOffset.w);
        vec4 foam2 = texture(foamTexture, _Time * _FoamOffset.xy + vUv + normalEC.xy * _FoamOffset.w);
        float temp_output = clamp( (foam1.g + foam2.g ) * depthMask*foamColor.g - _FoamFactor,0.,1.);
        color.rgb = mix( color.rgb , _FoamColor * _FoamOffset.z , temp_output);
        // color.a = 1.;
        // #include <logdepthbuf_fragment>
        // return;



        // detail
        vec2 detailpanner = (vUv + normalEC.xy*_WaterWave);
        vec3 detail = texture(foamTexture,detailpanner).b * _DetailColor;


        //alpha
        float alpha = clamp(eyeDepthSubScreenPos-_AlphaWidth,0.,1.);

        color.rgb *= diffuse;
        color.rgb *= 0.5;
        color.rgb += specular;
        color.rgb += rim * 0.2;
        color.rgb += waterColor*detail * 0.5;
        color.a = alpha;








		#include <logdepthbuf_fragment>

    }
`;

export { shader };