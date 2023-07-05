import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { shader as depthVertexShader } from './shaders/depth-vs.js';
import { shader as depthFragmentShader } from './shaders/depth-fs.js';
import { shader as waterVertexShader } from './shaders/water-vs.js';
import { shader as waterFragmentShader } from './shaders/water-fs.js';
import { GUI } from 'dat.gui';

const clock = new THREE.Clock();

// renderer
// const renderer = new THREE.WebGLRenderer({ antialias: true });
const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// renderer.gammaFactor = 2.2;
document.body.append(renderer.domElement);
// stats
const stats = new Stats();
document.body.appendChild(stats.dom);
// scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, renderer.domElement.width / renderer.domElement.height, 0.1, 10000);
camera.position.set(-700, 500, 100);
// control
const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 0.01;
controls.maxDistance = 5000;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = true;
controls.autoRotate = false;

const animitionGroup = new THREE.AnimationObjectGroup();
const mixer = new THREE.AnimationMixer(animitionGroup);

let planeMesh: THREE.Mesh;
const loader = new GLTFLoader();

const loadModel = async () => {
	// cube
	// const cubeGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
	// const cubeMaterial = new THREE.MeshStandardMaterial({
	// 	color: 'rgb(100, 70, 30)',
	// 	roughness: 0.4,
	// 	metalness: 0.0,
	// 	side: THREE.DoubleSide,
	// });
	// const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
	// cube.castShadow = cube.receiveShadow = true;
	// cube.position.set(-0.6, 0.2, -0.6);
	// cube.rotation.set(-Math.PI / 2, 0, 0);
	// cube.scale.set(100,100,100);
	// scene.add(cube);

	//sandbox
	const glb = await loader.loadAsync('assets/island.glb');

	//将模型添加至场景
	glb.scene.scale.set(0.1, 0.1, 0.1);
	glb.scene.position.set(-500, 100, 500);
	glb.scene.updateMatrixWorld(true);
	glb.scene.traverse(v => {
		if (v instanceof THREE.Mesh) {
			if (v.name === 'Material2_6') {
				planeMesh = v;
				planeMesh.visible = false;

				planeMesh!.translateZ(-5);
				planeMesh!.material = material;
				planeMesh!.geometry.computeTangents();
			}
		}
	});
	scene.add(glb.scene);

	// 加载地图模型
	// house
	// const house = loader.loadAsync('../assets/BOX2.glb').then(function (glb) {
	// 	//将模型添加至场景
	// 	scene.add(glb.scene);
	// 	//设置模型位置
	// 	glb.scene.position.set(20, 0, -80);
	// 	glb.scene.scale.set(0.1, 0.1, 0.1);
	// 	animitionGroup.add(glb.scene);
	// 	mixer.clipAction(glb.animations[0]).play();
	// });

	// hills
	// const hills = loader.loadAsync('../assets/hills.glb').then(function (glb) {
	// 	//将模型添加至场景
	// 	scene.add(glb.scene);
	// 	//设置模型位置
	// 	glb.scene.position.set(0, 0, 0);
	// 	glb.scene.scale.set(100, 100, 100);
	// });

	// ground
	// const groundGeometry = new THREE.PlaneGeometry(300, 300);
	// const groundMaterial = new THREE.MeshStandardMaterial({
	// 	color: 'rgb(20, 20, 30)',
	// 	roughness: 0.4,
	// 	metalness: 0.0,
	// 	side: THREE.DoubleSide,
	// });
	// const ground = new THREE.Mesh(groundGeometry, groundMaterial);
	// ground.castShadow = ground.receiveShadow = true;
	// ground.position.set(0, 0, 0);
	// ground.rotation.set(-Math.PI / 2, 0, 0);
	// scene.add(ground);
};

// Grid
const grid = new THREE.GridHelper(300, 10, 0xf0f0f0, 0xffffff);
grid.position.set(0, -1, 0);
// scene.add(grid);

// light1
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(100, 100.5, -200.5);
light.castShadow = true;
light.shadow.camera.top = 2;
light.shadow.camera.bottom = -2;
light.shadow.camera.right = 2;
light.shadow.camera.left = -2;
light.shadow.bias = -0.00001;
light.shadow.mapSize.set(4096, 4096);
scene.add(light);
const lightColor = light.color;
const lightDir = new THREE.Vector3().subVectors(light.target.position, light.position).normalize();

// light2
const hemiLight = new THREE.HemisphereLight(0xbbbbbb, 0x080808, 1);
scene.add(hemiLight);
// light1 helper
scene.add(new THREE.DirectionalLightHelper(light, 2, 0xffff00));
// axis helper
scene.add(new THREE.AxesHelper(500));

const depthMaterial = new THREE.ShaderMaterial({
	uniforms: {
		resolution: { value: new THREE.Vector2(1, 1) },
		projectionInverse: { value: camera.projectionMatrixInverse },
	},
	vertexShader: depthVertexShader,
	fragmentShader: depthFragmentShader,
	glslVersion: THREE.GLSL3,
});
const depth = new THREE.WebGLRenderTarget(1, 1, {
	wrapS: THREE.ClampToEdgeWrapping,
	wrapT: THREE.ClampToEdgeWrapping,
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	format: THREE.RGBAFormat,
	type: THREE.UnsignedByteType,
	stencilBuffer: false,
	depthBuffer: true,
	generateMipmaps: true,
});
const hdr = new THREE.WebGLRenderTarget(1, 1, {
	wrapS: THREE.ClampToEdgeWrapping,
	wrapT: THREE.ClampToEdgeWrapping,
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	format: THREE.RGBAFormat,
	type: THREE.UnsignedByteType,
	stencilBuffer: false,
	depthBuffer: true,
	generateMipmaps: true,
});

//plane
const textureLoader = new THREE.TextureLoader();
const foam = textureLoader.load('assets/foam.png');
const normal = textureLoader.load('assets/normal.jpg');
normal.wrapS = normal.wrapT = foam.wrapS = foam.wrapT = THREE.RepeatWrapping;
const geometry = new THREE.PlaneGeometry(1300, 1300, 200, 200);
geometry.computeTangents();

const uniforms = {
	depthBuffer: { value: null },
	resolution: { value: new THREE.Vector2(1, 1) },
	foamTexture: { value: null },
	normalTexture: { value: null },
	time: { value: 0 },
	projectionInverse: { value: camera.projectionMatrixInverse },
	lightDir: { value: lightDir },
	near: { value: camera.near },
	far: { value: camera.far },

	_Frequency: { value: 30 },
	_Amplitude: { value: 22 },
	_Speed: { value: 3.8 },

	lightColor: { value: lightColor },
	_WaterSpecular: { value: 0.5 },
	_WaterSmoothness: { value: 3.81 },
	_NormalScale: { value: 0.3 },
	_WaveParams: { value: new THREE.Vector4(0.04, 0.02, -0.02, -0.04) },
	_RimPower: { value: 8 },
	deepColor: { value: new THREE.Color(0, 98 / 255, 128 / 255) },
	shalowColor: { value: new THREE.Color(40 / 255, 253 / 255, 1) },
	_FoamDepth: { value: 6.5 },
	_FoamOffset: { value: new THREE.Vector4(-0.01, 0.01, 2, 0.05) },
	_FoamFactor: { value: 5.4 },
	_FoamColor: { value: new THREE.Color(1, 1, 1) },
	_DetailColor: { value: new THREE.Color(0.65, 0.65, 0.65) },
	_WaterWave: { value: 0.02 },
	_AlphaWidth: { value: 0.25 },
};
const material = new THREE.ShaderMaterial({
	uniforms: uniforms,
	vertexShader: waterVertexShader,
	fragmentShader: waterFragmentShader,
	transparent: true,
	depthWrite: false,
	side: THREE.DoubleSide,
	glslVersion: THREE.GLSL3,
});

const plane = new THREE.Mesh(geometry, material);
plane.material.uniforms.depthBuffer.value = depth.texture;
plane.material.uniforms.foamTexture.value = foam;
plane.material.uniforms.normalTexture.value = normal;
plane.position.set(0, 10, 0);
plane.rotateX(THREE.MathUtils.degToRad(-90));
plane.updateMatrixWorld();
// scene.add(plane);

// resize
function resize() {
	const width = window.innerWidth;
	const height = window.innerHeight;
	const dPR = window.devicePixelRatio;
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	renderer.setSize(width, height);
	depth.setSize(width * dPR, height * dPR);
	hdr.setSize(width * dPR, height * dPR);
	plane.material.uniforms.resolution.value.set(width * dPR, height * dPR);
	planeMesh && (planeMesh.material as THREE.ShaderMaterial).uniforms.resolution.value.set(width * dPR, height * dPR);
	depthMaterial.uniforms.resolution.value.set(width * dPR, height * dPR);
}
// render
function render() {
	plane.visible = false;
	planeMesh && (planeMesh.visible = false);
	scene.overrideMaterial = depthMaterial;
	renderer.setRenderTarget(depth);
	renderer.render(scene, camera);

	plane.visible = true;
	planeMesh && (planeMesh.visible = true);
	scene.overrideMaterial = null;
	renderer.setRenderTarget(null);
	renderer.render(scene, camera);

	stats.update();
	camera.updateMatrixWorld();
	controls.update();
	light.updateMatrixWorld();
	light.target.updateMatrixWorld();
	if (mixer) mixer.update(clock.getDelta());

	plane.material.uniforms.time.value = performance.now();
	planeMesh && ((planeMesh.material as THREE.ShaderMaterial).uniforms.time.value = performance.now());
	renderer.setAnimationLoop(render);
}

window.addEventListener('resize', resize);

const gui = new GUI();
gui.addColor(uniforms.deepColor, 'value')
	.name('深水颜色')
	.onChange(v => {
		uniforms.deepColor.value.r = v.r / 255;
		uniforms.deepColor.value.g = v.g / 255;
		uniforms.deepColor.value.b = v.b / 255;
	});
gui.addColor(uniforms.shalowColor, 'value')
	.name('浅水颜色')
	.onChange(v => {
		uniforms.shalowColor.value.r = v.r / 255;
		uniforms.shalowColor.value.g = v.g / 255;
		uniforms.shalowColor.value.b = v.b / 255;
	});
gui.add(uniforms._WaveParams.value, 'x').name('水浪A:x偏移速度').min(-0.1).max(0.1).step(0.01);
gui.add(uniforms._WaveParams.value, 'y').name('水浪A:y偏移速度').min(-0.1).max(0.1).step(0.01);
gui.add(uniforms._WaveParams.value, 'z').name('水浪B:x偏移速度').min(-0.1).max(0.1).step(0.01);
gui.add(uniforms._WaveParams.value, 'w').name('水浪B:y偏移速度').min(-0.1).max(0.1).step(0.01);

const foamUI = gui.addFolder('泡沫');
foamUI.add(uniforms._FoamDepth, 'value').name('范围').min(-2).max(10).step(0.1);
foamUI.add(uniforms._FoamFactor, 'value').name('衰减').min(0).max(10).step(0.1);
foamUI.add(uniforms._FoamOffset.value, 'x').name('x方向速度').min(-0.1).max(0.1).step(0.01);
foamUI.add(uniforms._FoamOffset.value, 'y').name('y方向速度').min(-0.1).max(0.1).step(0.01);
foamUI.add(uniforms._FoamOffset.value, 'z').name('强度').min(0).max(10).step(0.1);
foamUI.add(uniforms._FoamOffset.value, 'w').name('扰动').min(0).max(0.1).step(0.01);
foamUI
	.addColor(uniforms._FoamColor, 'value')
	.name('颜色')
	.onChange(v => {
		uniforms._FoamColor.value.r = v.r / 255;
		uniforms._FoamColor.value.g = v.g / 255;
		uniforms._FoamColor.value.b = v.b / 255;
	});

const verUI = gui.addFolder('顶点动画');
verUI.add(uniforms._Frequency, 'value').name('频率').min(0).max(50).step(1);
verUI.add(uniforms._Amplitude, 'value').name('幅度').min(0).max(100).step(0.1);
verUI.add(uniforms._Speed, 'value').name('速度').min(0).max(20).step(1);

const specularUI = gui.addFolder('高光');
specularUI
	.addColor(uniforms.lightColor, 'value')
	.name('光的颜色')
	.onChange(v => {
		uniforms.lightColor.value.r = v.r / 255;
		uniforms.lightColor.value.g = v.g / 255;
		uniforms.lightColor.value.b = v.b / 255;
	});
specularUI.add(uniforms._WaterSpecular, 'value').name('强度').min(0).max(1).step(0.01);
specularUI.add(uniforms._WaterSmoothness, 'value').name('衰减').min(0).max(10).step(0.1);
specularUI.add(uniforms._NormalScale, 'value').name('法线强度').min(0).max(1).step(0.01);
specularUI.add(uniforms._RimPower, 'value').name('菲尼尔强度').min(0).max(20).step(0.1);

const detailUI = gui.addFolder('细节');
detailUI
	.addColor(uniforms._DetailColor, 'value')
	.name('颜色')
	.onChange(v => {
		uniforms._DetailColor.value.r = v.r / 255;
		uniforms._DetailColor.value.g = v.g / 255;
		uniforms._DetailColor.value.b = v.b / 255;
	});
detailUI.add(uniforms._WaterWave, 'value').name('细节扰动强度').min(0).max(0.1).step(0.01);
detailUI.add(uniforms._AlphaWidth, 'value').name('边缘透明宽度').min(-1).max(1).step(0.01);

// moveCube();
loadModel();
resize();
render();
