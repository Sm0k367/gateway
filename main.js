// --- SM0KEN420 ARCHITECTURES // INFINITE NEURAL ENGINE ---
let audioContext, analyzer, dataArray, source, audio;
let isPlaying = false;
let mouseX = 0, mouseY = 0;
let composer, bloomPass;

// --- THREE.JS ARCHITECTURE ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('aether-canvas'), 
    antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- THE POST-PROCESSING COMPOSER ---
composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));

bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 
    1.8, 0.5, 0.85
);
composer.addPass(bloomPass);

// --- THE INFINITE MORPH CORE ---
const geometry = new THREE.IcosahedronGeometry(2, 64);
// Store the Original DNA (Original Positions)
const originalPositions = new Float32Array(geometry.attributes.position.array);

const material = new THREE.MeshStandardMaterial({
    color: 0x00f2ff,
    wireframe: true,
    transparent: true,
    opacity: 0.8,
    emissive: 0x00f2ff,
    emissiveIntensity: 0.6
});

const core = new THREE.Mesh(geometry, material);
scene.add(core);

const light = new THREE.PointLight(0x00f2ff, 15, 50);
scene.add(light);
camera.position.z = 5;

// --- MOUSE TRACKING ---
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// --- AUDIO PROTOCOL ---
const audioInput = document.getElementById('audio-input');
const launchBtn = document.getElementById('launch-btn');

audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audio = new Audio(URL.createObjectURL(file));
        document.getElementById('status-text').innerText = "SIGNAL SYNCED // " + file.name.toUpperCase();
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

    gsap.to("#setup-overlay", { opacity: 0, scale: 1.2, duration: 2, onComplete: () => {
        document.getElementById('setup-overlay').style.display = 'none';
        document.getElementById('interface').style.opacity = '1';
        audio.play();
        isPlaying = true;
    }});
});

// --- THE INFINITE MORPH LOGIC ---
function runNeuralMorph(bass, mid, treble) {
    const positions = geometry.attributes.position.array;
    const time = Date.now() * 0.001;

    for (let i = 0; i < positions.length; i += 3) {
        // Read Original DNA
        const ox = originalPositions[i];
        const oy = originalPositions[i+1];
        const oz = originalPositions[i+2];

        // Complex Harmonic Wavefront
        // We use Math.sin based on the original coordinates to ensure it never "drifts"
        const noise = Math.sin(ox * 2 + time) * Math.cos(oy * 2 + time) * Math.sin(oz * 2 + time);
        
        // Intensity scaling (1000x logic: separates bass and mid influence)
        const displacement = (bass / 120) * noise + (mid / 250);
        
        // Mouse influence + Original DNA + Noise Displacement
        positions[i] = ox + (ox * displacement) + (mouseX * 0.15);
        positions[i+1] = oy + (oy * displacement) + (mouseY * 0.15);
        positions[i+2] = oz + (oz * displacement);
    }
    geometry.attributes.position.needsUpdate = true;
}

// --- MAIN LOOP ---
function animate() {
    requestAnimationFrame(animate);

    if (isPlaying) {
        analyzer.getByteFrequencyData(dataArray);
        
        // Frequency Octave Extraction
        const bass = dataArray[2];      // Low-end pump
        const mid = dataArray[50];      // Melodic energy
        const treble = dataArray[120];  // High-end shimmer

        runNeuralMorph(bass, mid, treble);

        // Core Physics
        core.rotation.y += 0.003 + (mid * 0.0001);
        core.rotation.x += 0.001;

        // Visual Overdrive
        bloomPass.strength = 1.2 + (bass / 80);
        bloomPass.threshold = 0.8 - (treble / 400); // Glow lights up on highs
        
        const hue = (0.5 + (bass * 0.001)) % 1;
        material.color.setHSL(hue, 0.8, 0.5);
        light.intensity = 10 + (bass / 4);

        document.getElementById('hz-display').innerText = `NEURAL LOAD: ${(bass / 2.55).toFixed(2)}%`;
    }

    composer.render();
}

animate();

// Resizer
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});
