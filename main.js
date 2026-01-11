// --- AETHER-MORPH // THE HYPER-STIM ENGINE ---
let audioContext, analyzer, dataArray, source, audio;
let isPlaying = false;
let mouseX = 0, mouseY = 0;

// --- THREE.JS CORE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('aether-canvas'), 
    antialias: true,
    alpha: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// --- THE AETHER CORE (Vertex Shader Displacement) ---
const geometry = new THREE.IcosahedronGeometry(2, 64); 
const material = new THREE.MeshStandardMaterial({
    color: 0x00f2ff,
    wireframe: true,
    transparent: true,
    opacity: 0.6,
    emissive: 0x004455,
    metalness: 1,
    roughness: 0
});

const core = new THREE.Mesh(geometry, material);
scene.add(core);

const light = new THREE.PointLight(0x00f2ff, 20, 100);
light.position.set(5, 5, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.2));

camera.position.z = 5;

// --- MOUSE TRACKING ---
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// --- AUDIO LOGIC ---
const audioInput = document.getElementById('audio-input');
const launchBtn = document.getElementById('launch-btn');
const statusText = document.getElementById('status-text');

audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audio = new Audio(URL.createObjectURL(file));
        statusText.innerHTML = `NEURAL LINK ESTABLISHED<br><span class="text-cyan-400 text-[7px]">${file.name.toUpperCase()}</span>`;
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

    gsap.to("#setup-overlay", { opacity: 0, scale: 0.9, duration: 2, onComplete: () => {
        document.getElementById('setup-overlay').style.display = 'none';
        document.getElementById('interface').style.opacity = '1';
        document.getElementById('interface').classList.remove('scale-110');
        audio.play();
        isPlaying = true;
    }});
});

// --- THE MORPHING ENGINE ---
function updateGeometry(audioStrength) {
    const time = Date.now() * 0.001;
    const positions = geometry.attributes.position;
    const vector = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
        vector.fromBufferAttribute(positions, i);
        
        // Perlin-style Noise Simulation
        const noise = Math.sin(vector.x * 2 + time + (audioStrength * 0.05)) * Math.cos(vector.y * 2 + time + (audioStrength * 0.05)) * Math.sin(vector.z * 2 + time);
        
        const ratio = 1 + (noise * 0.3) * (audioStrength / 100);
        vector.multiplyScalar(ratio);
        
        // Pull toward mouse cursor
        vector.x += (mouseX * 0.2);
        vector.y += (mouseY * 0.2);

        positions.setXYZ(i, vector.x, vector.y, vector.z);
    }
    positions.needsUpdate = true;
}

// --- RENDER LOOP ---
function animate() {
    requestAnimationFrame(animate);

    if (isPlaying) {
        analyzer.getByteFrequencyData(dataArray);
        
        // Calculate Audio Energy
        let sum = 0;
        for(let i = 0; i < 10; i++) sum += dataArray[i]; // Focus on Bass
        const bassLevel = sum / 10;

        updateGeometry(bassLevel);

        // Dynamic Rotation
        core.rotation.y += 0.005 + (bassLevel * 0.0005);
        core.rotation.x += 0.002;

        // Visual Feedback
        const hue = (0.5 + (bassLevel * 0.002)) % 1;
        material.color.setHSL(hue, 0.8, 0.5);
        light.intensity = 10 + (bassLevel * 0.5);
        
        document.getElementById('hz-display').innerText = `STIM: ${(bassLevel / 2.55).toFixed(2)}%`;
    }

    renderer.render(scene, camera);
}

animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
