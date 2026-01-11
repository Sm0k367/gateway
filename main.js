// --- EPIC TECH AI // AFTER DARK // OVERDRIVE ENGINE ---
let audioContext, analyzer, dataArray, source, audio;
let isPlaying = false;
let progress = 0;
const velocity = 0.0006; 

// --- THREE.JS FOUNDATION ---
const scene = new THREE.Scene();
// Fog is adjusted for high-definition depth
scene.fog = new THREE.FogExp2(0x000000, 0.04);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('warp-canvas'), 
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 1. THE ARCHITECT'S PATH
const points = [];
for (let i = 0; i <= 10; i++) {
    points.push(new THREE.Vector3(
        Math.sin(i * 1.5) * 12, 
        Math.cos(i * 1.5) * 12, 
        i * 35
    ));
}
const curve = new THREE.CatmullRomCurve3(points);
curve.closed = true;

// 2. THE GEOMETRY (EMISSIVE NEON OVERDRIVE)
const tubeGeom = new THREE.TubeGeometry(curve, 120, 4, 16, true);
const tubeMat = new THREE.MeshStandardMaterial({
    color: 0x00f2ff,
    emissive: 0x00f2ff, // This makes the lines glow
    emissiveIntensity: 2,
    wireframe: true,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.6
});
const tunnel = new THREE.Mesh(tubeGeom, tubeMat);
scene.add(tunnel);

// 3. INTENSE POINT LIGHT (The "Engine Glow")
const light = new THREE.PointLight(0xff00ff, 50, 100);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.1));

// --- AUDIO INITIALIZATION ---
const audioInput = document.getElementById('audio-input');
const launchBtn = document.getElementById('launch-btn');

audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audio = new Audio(URL.createObjectURL(file));
        document.getElementById('status-text').innerHTML = `<span class="text-cyan-400 text-lg font-black">SIGNAL LOCKED</span><br>${file.name.toUpperCase()}`;
        launchBtn.classList.remove('hidden');
    }
});

launchBtn.addEventListener('click', async () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();
    source = audioContext.createMediaElementSource(audio);
    analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);
    dataArray = new Uint8Array(analyzer.frequencyBinCount);

    gsap.to("#setup-overlay", { opacity: 0, scale: 0.7, duration: 1.5, onComplete: () => {
        document.getElementById('setup-overlay').style.display = 'none';
        document.getElementById('interface').style.opacity = '1';
        document.getElementById('interface').classList.remove('scale-125');
        audio.play();
        isPlaying = true;
    }});
});

// --- RENDER LOOP (THE JOURNEY) ---
function animate() {
    requestAnimationFrame(animate);

    if (isPlaying) {
        analyzer.getByteFrequencyData(dataArray);
        const bass = dataArray[2];
        const mid = dataArray[40];
        const treble = dataArray[100];

        // Smooth Camera Glide
        progress += velocity + (bass * 0.000003);
        if (progress > 1) progress = 0;

        const pos = curve.getPointAt(progress);
        const lookAt = curve.getPointAt((progress + 0.015) % 1);

        camera.position.copy(pos);
        camera.lookAt(lookAt);
        light.position.copy(pos);

        // EVER-CHANGING HD NEON COLORS
        const time = Date.now() * 0.0003;
        const hue = (time) % 1;
        
        // Update both the base color and the emissive glow
        tubeMat.color.setHSL(hue, 1, 0.5);
        tubeMat.emissive.setHSL(hue, 1, 0.5);
        light.color.setHSL((hue + 0.4) % 1, 1, 0.5);

        // DYNAMIC INTENSITY (Reacts to the music)
        tubeMat.emissiveIntensity = 1 + (bass / 60);
        light.intensity = 30 + (bass / 2);
        
        // Subtle Tunnel Breathing
        tunnel.scale.set(1 + mid/600, 1 + mid/600, 1);
        tubeMat.opacity = 0.4 + (treble / 255);

        document.getElementById('hz-display').innerText = `FLOW: ${(bass / 2.55).toFixed(2)}%`;
    }

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
