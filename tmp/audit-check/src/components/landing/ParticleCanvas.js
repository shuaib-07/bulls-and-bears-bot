"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticleCanvas = ParticleCanvas;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const THREE = __importStar(require("three"));
function ParticleCanvas() {
    const containerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!containerRef.current)
            return;
        const container = containerRef.current;
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x030303, 0.0015);
        scene.background = new THREE.Color(0x030303);
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
        camera.position.z = 450;
        const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        const particleCount = 4000;
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const colorOrange = new THREE.Color(0xff5f1f);
        const colorBull = new THREE.Color(0x10b981);
        const colorBear = new THREE.Color(0xf43f5e);
        const spread = 1800;
        const orbRadius = 220;
        for (let i = 0; i < particleCount; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            const r = orbRadius * Math.cbrt(Math.random());
            // Mix between sphere core and spread cloud
            const isCloud = Math.random() > 0.4;
            if (isCloud) {
                vertices[i * 3] = (Math.random() - 0.5) * spread;
                vertices[i * 3 + 1] = (Math.random() - 0.5) * spread;
                vertices[i * 3 + 2] = (Math.random() - 0.5) * spread;
            }
            else {
                vertices[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                vertices[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                vertices[i * 3 + 2] = r * Math.cos(phi);
            }
            // Assign financial hues (orange accent, bull green, bear crimson)
            const randColor = Math.random();
            const chosenColor = randColor < 0.6 ? colorOrange : randColor < 0.8 ? colorBull : colorBear;
            colors[i * 3] = chosenColor.r;
            colors[i * 3 + 1] = chosenColor.g;
            colors[i * 3 + 2] = chosenColor.b;
        }
        geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        const material = new THREE.PointsMaterial({
            size: 1.8,
            vertexColors: true,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const particles = new THREE.Points(geometry, material);
        scene.add(particles);
        let animationFrameId;
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", handleResize);
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            particles.rotation.y += 0.0008;
            particles.rotation.x += 0.0003;
            renderer.render(scene, camera);
        };
        animate();
        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);
    return (0, jsx_runtime_1.jsx)("div", { ref: containerRef, className: "fixed inset-0 z-0 pointer-events-none w-full h-full opacity-70" });
}
