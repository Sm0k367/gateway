// --- AETHER-MORPH // THE POST-PROCESSING ENGINE ---
let audioContext, analyzer, dataArray, source, audio;
let isPlaying = false;
let mouseX = 0, mouseY = 0;
let composer, bloomPass;

// --- THREE.JS CORE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('aether-canvas'), 
    antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// --- POST-PROCESSING CHAIN ---
composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);

// Unreal Bloom: Strength, Radius, Threshold
bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 
    1.5, 0.4, 0.85
);
composer.addPass(bloomPass);

// --- THE MORPHING OBJECT ---
const geometry = new THREE.IcosahedronGeometry(2, 64);
const material = new THREE.MeshStandardMaterial({
    color: 0x00f2ff,
    wireframe: true,
    emissive: 0x00f2ff,
    emissiveIntensity: 0.5
});
const core = new THREE.Mesh(geometry, material);
scene.add(core);

const light = new THREE.PointLight(0x00f2ff, 20, 100);
scene.add(light);
camera.position.z = 5;

// --- MOUSE & AUDIO LOGIC ---
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

const audioInput = document.getElementById('audio-input');
const launchBtn = document.getElementById('launch-btn');

audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audio = new Audio(URL.createObjectURL(file));
        document.getElementById('status-text').innerText = "SIGNAL SYNCED: " + file.name.substring(0, 10);
        launchBtn.classList.remove('hidden');
    }
});

launchBtn.addEventListener('click', async () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();
    source = audioContext.createMediaElementSource(audio);
    analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 512;
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);
    dataArray = new Uint8Array(analyzer.frequencyBinCount);

    gsap.to("#setup-overlay", { opacity: 0, duration: 2, onComplete: () => {
        document.getElementById('setup-overlay').style.display = 'none';
        document.getElementById('interface').style.opacity = '1';
        audio.play();
        isPlaying = true;
    }});
});

// --- RENDER LOOP WITH BLOOM OVERDRIVE ---
function animate() {
    requestAnimationFrame(animate);

    if (isPlaying) {
        analyzer.getByteFrequencyData(dataArray);
        let bass = dataArray[2];

        // 1. Audio-Reactive Morphing
        const positions = geometry.attributes.position;
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);

            const noise = Math.sin(x * 1.5 + time) * Math.cos(y * 1.5 + time);
            const displacement = 1 + (noise * (bass / 150));
            
            // Apply Mouse Lean
            positions.setXYZ(i, x * displacement + (mouseX * 0.1), y * displacement + (mouseY * 0.1), z * displacement);
        }
        positions.needsUpdate = true;

        // 2. Cinematic Bloom Pulse
        // When the bass hits, the glow becomes more intense
        bloomPass.strength = 1.0 + (bass / 100);
        bloomPass.threshold = 0.9 - (bass / 500);
        
        core.rotation.y += 0.005;
        light.intensity = 10 + (bass / 5);

        document.getElementById('hz-display').innerText = `STIM: ${(bass / 2.55).toFixed(1)}%`;
    }

    // Use composer.render() instead of renderer.render()
    composer.render();
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});
