// --- EPIC TECH AI // AFTER DARK // TUNNEL ENGINE ---
let audioContext, analyzer, dataArray, source, audio;
let isPlaying = false;
let progress = 0;
const velocity = 0.0006; // The constant "Drift" speed

// --- THREE.JS FOUNDATION ---
const scene = new THREE.Scene();
// Fog creates depth without blur
scene.fog = new THREE.FogExp2(0x000000, 0.035);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('warp-canvas'), 
    antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 1. THE ARCHITECT'S PATH
// Creating a twisting 3D loop for the tunnel
const points = [];
for (let i = 0; i <= 10; i++) {
    points.push(new THREE.Vector3(
        Math.sin(i * 1.5) * 10, 
        Math.cos(i * 1.5) * 10, 
        i * 30
    ));
}
const curve = new THREE.CatmullRomCurve3(points);
curve.closed = true;

// 2. THE GEOMETRY (The "Tunnel")
const tubeGeom = new THREE.TubeGeometry(curve, 100, 3, 12, true);
const tubeMat = new THREE.MeshBasicMaterial({
    color: 0x00f2ff,
    wireframe: true,
    side: THREE.BackSide, // View from the inside
    transparent: true,
    opacity: 0.4
});
const tunnel = new THREE.Mesh(tubeGeom, tubeMat);
scene.add(tunnel);

// 3. AMBIENT GLOW
const light = new THREE.PointLight(0xff00ff, 10, 50);
scene.add(light);

// --- AUDIO INITIALIZATION ---
const audioInput = document.getElementById('audio-input');
const launchBtn = document.getElementById('launch-btn');

audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audio = new Audio(URL.createObjectURL(file));
        document.getElementById('status-text').innerHTML = `<span class="text-cyan-400">SYNCED:</span><br>${file.name.toUpperCase()}`;
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

    gsap.to("#setup-overlay", { opacity: 0, scale: 0.9, duration: 1.5, onComplete: () => {
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
        const treble = dataArray[100];

        // Travel Logic
        progress += velocity + (bass * 0.000002);
        if (progress > 1) progress = 0;

        // Position camera on the path
        const pos = curve.getPointAt(progress);
        const lookAt = curve.getPointAt((progress + 0.02) % 1);

        camera.position.copy(pos);
        camera.lookAt(lookAt);
        light.position.copy(pos);

        // HD Neon Color Cycle (Smooth transitions)
        const time = Date.now() * 0.0002;
        const hue = (time) % 1;
        tubeMat.color.setHSL(hue, 1, 0.5);
        light.color.setHSL((hue + 0.3) % 1, 1, 0.5);

        // Reactivity
        tunnel.scale.set(1 + bass/400, 1 + bass/400, 1);
        tubeMat.opacity = 0.2 + (treble / 300);

        document.getElementById('hz-display').innerText = `FLOW: ${(bass / 2.55).toFixed(2)}%`;
    }

    renderer.render(scene, camera);
}

animate();

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
