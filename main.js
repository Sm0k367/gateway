// --- EPIC TECH AI // AFTER DARK // ENGINE V4 ---
let audioContext, analyzer, dataArray, source, audio;
let isPlaying = false;
let mouseX = 0, mouseY = 0;
let composer, bloomPass;

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('aether-canvas'), 
    antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- POST-PROCESSING (NEON OVERDRIVE) ---
composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));

// High-Intensity Bloom for that "Lounge" glow
bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 
    2.5, 0.5, 0.1
);
composer.addPass(bloomPass);

// --- THE LIQUID NEON CORE ---
const geometry = new THREE.IcosahedronGeometry(2, 64);
const originalPositions = new Float32Array(geometry.attributes.position.array);

const material = new THREE.MeshStandardMaterial({
    color: 0x00f2ff,
    wireframe: true,
    transparent: true,
    opacity: 0.9,
    emissive: 0xff00ff,
    emissiveIntensity: 0.5
});

const core = new THREE.Mesh(geometry, material);
scene.add(core);

const light = new THREE.PointLight(0xff00ff, 20, 60);
scene.add(light);
camera.position.z = 5;

// --- INTERACTIVE TRACKING ---
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// --- SIGNAL INITIALIZATION ---
const audioInput = document.getElementById('audio-input');
const launchBtn = document.getElementById('launch-btn');

audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audio = new Audio(URL.createObjectURL(file));
        document.getElementById('status-text').innerHTML = `<span class="text-magenta-500">SYSTEM READY:</span><br>${file.name.toUpperCase()}`;
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

// --- HD COLOR & MORPH ENGINE ---
function updateAfterDark(bass, mid, treble) {
    const positions = geometry.attributes.position.array;
    const time = Date.now() * 0.0012; // Slightly faster for After Dark vibe

    // 1. Infinite Vertex Morphing
    for (let i = 0; i < positions.length; i += 3) {
        const ox = originalPositions[i];
        const oy = originalPositions[i+1];
        const oz = originalPositions[i+2];

        // Complex wave math for organic "liquid" look
        const wave = Math.sin(ox * 1.2 + time) * Math.cos(oy * 1.5 + time);
        const distort = 1 + (wave * (bass / 110));

        positions[i] = ox * distort + (mouseX * 0.2);
        positions[i+1] = oy * distort + (mouseY * 0.2);
        positions[i+2] = oz * distort;
    }
    geometry.attributes.position.needsUpdate = true;

    // 2. HD Ever-Changing Colors
    // Shifting through the neon spectrum (Cyan -> Magenta -> Purple -> Blue)
    const hue = (time * 0.1 + (bass * 0.0005)) % 1;
    material.color.setHSL(hue, 1.0, 0.5);
    material.emissive.setHSL((hue + 0.3) % 1, 1.0, 0.5); // Multi-tone glow
    light.color.setHSL(hue, 1.0, 0.5);

    // 3. Post-Processing Reactions
    bloomPass.strength = 1.5 + (bass / 70);
    bloomPass.radius = 0.4 + (treble / 200);
}

// --- RENDER LOOP ---
function animate() {
    requestAnimationFrame(animate);

    if (isPlaying) {
        analyzer.getByteFrequencyData(dataArray);
        const bass = dataArray[2];
        const mid = dataArray[40];
        const treble = dataArray[100];

        updateAfterDark(bass, mid, treble);

        core.rotation.y += 0.004 + (mid * 0.0002);
        core.rotation.z += 0.002;

        document.getElementById('hz-display').innerText = `PULSE: ${(bass / 2.55).toFixed(2)}%`;
    }

    composer.render();
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});
