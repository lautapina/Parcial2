// interactivo3d.js
// Sistema Solar Interactivo 3D para Laut Medial usando P5.js

let canvas3d;
let planets = [];
let stars = [];
let camera = { x: 0, y: -100, z: 200 };
let isDragging = false;
let dragObject = null;
let previousMouse = { x: 0, y: 0 };
let rotationSpeed = 1;
let cameraAngleX = 0;
let cameraAngleY = 0;

// Datos de los planetas
const planetData = [
    { name: 'Sol', size: 25, color: [255, 170, 0], distance: 0, moons: [], glow: true },
    { name: 'Mercurio', size: 4, color: [140, 120, 83], distance: 50, moons: [] },
    { name: 'Venus', size: 6, color: [255, 198, 73], distance: 70, moons: [] },
    { name: 'Tierra', size: 8, color: [74, 144, 226], distance: 100, moons: [{ size: 2, distance: 15, color: [200, 200, 200] }] },
    { name: 'Marte', size: 6, color: [205, 92, 92], distance: 130, moons: [{ size: 1, distance: 12, color: [136, 136, 136] }] },
    { name: 'Júpiter', size: 20, color: [216, 202, 157], distance: 180, moons: [
        { size: 3, distance: 30, color: [255, 255, 204] },
        { size: 2, distance: 40, color: [204, 204, 255] },
        { size: 2, distance: 50, color: [255, 204, 204] }
    ]},
    { name: 'Saturno', size: 16, color: [250, 213, 165], distance: 230, moons: [{ size: 2.5, distance: 35, color: [221, 221, 221] }], hasRings: true },
    { name: 'Urano', size: 12, color: [79, 208, 231], distance: 280, moons: [{ size: 1.5, distance: 25, color: [170, 170, 170] }] },
    { name: 'Neptuno', size: 11, color: [75, 112, 221], distance: 320, moons: [{ size: 2, distance: 28, color: [153, 153, 153] }] }
];

// Sketch P5.js para el canvas 3D
function sketch3D(p) {
    let tooltip = null;
    
    p.setup = function() {
        canvas3d = p.createCanvas(p.windowWidth, p.windowHeight * 0.6, p.WEBGL);
        canvas3d.parent('canvas3d-wrapper');
        
        // Crear tooltip
        createTooltip();
        
        // Inicializar planetas
        initializePlanets();
        
        // Generar estrellas
        generateStars(p);
        
        // Estilos del canvas
        canvas3d.canvas.style.borderRadius = '15px';
        canvas3d.canvas.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        canvas3d.canvas.style.cursor = 'grab';
    };
    
    p.draw = function() {
        p.background(0, 0, 17);
        
        // Configurar cámara
        p.camera(
            camera.x + p.cos(cameraAngleY) * p.cos(cameraAngleX) * camera.z,
            camera.y + p.sin(cameraAngleX) * camera.z,
            camera.z + p.sin(cameraAngleY) * p.cos(cameraAngleX) * camera.z,
            0, 0, 0,
            0, 1, 0
        );
        
        // Dibujar estrellas
        drawStars(p);
        
        // Actualizar y dibujar planetas
        updatePlanets(p);
        drawPlanets(p);
        
        // Detectar hover
        detectHover(p);
    };
    
    p.mousePressed = function() {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            isDragging = true;
            dragObject = detectPlanetClick(p);
            previousMouse = { x: p.mouseX, y: p.mouseY };
            canvas3d.canvas.style.cursor = 'grabbing';
            return false;
        }
    };
    
    p.mouseDragged = function() {
        if (isDragging) {
            const deltaX = p.mouseX - previousMouse.x;
            const deltaY = p.mouseY - previousMouse.y;
            
            if (dragObject) {
                // Mover planeta
                dragObject.x += deltaX * 0.5;
                dragObject.z += deltaY * 0.5;
            } else {
                // Rotar cámara
                cameraAngleY += deltaX * 0.01;
                cameraAngleX += deltaY * 0.01;
                cameraAngleX = p.constrain(cameraAngleX, -p.PI/3, p.PI/3);
            }
            
            previousMouse = { x: p.mouseX, y: p.mouseY };
        }
        return false;
    };
    
    p.mouseReleased = function() {
        isDragging = false;
        dragObject = null;
        canvas3d.canvas.style.cursor = 'grab';
    };
    
    p.mouseWheel = function(event) {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            if (event.delta > 0) {
                camera.z = p.min(camera.z * 1.1, 500);
                rotationSpeed = p.max(rotationSpeed * 0.9, 0.2);
            } else {
                camera.z = p.max(camera.z * 0.9, 100);
                rotationSpeed = p.min(rotationSpeed * 1.1, 3);
            }
            return false;
        }
    };
    
    p.windowResized = function() {
        p.resizeCanvas(p.windowWidth, p.windowHeight * 0.6);
    };
    
    function createTooltip() {
        tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            pointer-events: none;
            z-index: 1000;
            font-size: 12px;
            display: none;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        document.body.appendChild(tooltip);
    }
    
    function initializePlanets() {
        planetData.forEach((data, index) => {
            const angle = Math.random() * Math.PI * 2;
            const planet = {
                name: data.name,
                size: data.size,
                color: data.color,
                x: Math.cos(angle) * data.distance,
                y: 0,
                z: Math.sin(angle) * data.distance,
                angle: angle,
                distance: data.distance,
                orbitSpeed: 0.005 + Math.random() * 0.01,
                rotationY: 0,
                moons: [],
                glow: data.glow || false,
                hasRings: data.hasRings || false
            };
            
            // Crear lunas
            if (data.moons) {
                data.moons.forEach((moonData, moonIndex) => {
                    const moonAngle = Math.random() * Math.PI * 2;
                    planet.moons.push({
                        size: moonData.size,
                        color: moonData.color,
                        distance: moonData.distance,
                        angle: moonAngle,
                        orbitSpeed: 0.03 + moonIndex * 0.01,
                        x: 0, y: 0, z: 0
                    });
                });
            }
            
            planets.push(planet);
        });
    }
    
    function generateStars(p) {
        for (let i = 0; i < 800; i++) {
            stars.push({
                x: p.random(-1000, 1000),
                y: p.random(-1000, 1000),
                z: p.random(-1000, 1000),
                brightness: p.random(100, 255)
            });
        }
    }
    
    function drawStars(p) {
        p.fill(255, 150);
        p.noStroke();
        stars.forEach(star => {
            p.push();
            p.translate(star.x, star.y, star.z);
            p.fill(255, star.brightness);
            p.sphere(0.5);
            p.pop();
        });
    }
    
    function updatePlanets(p) {
        planets.forEach(planet => {
            if (!isDragging || dragObject !== planet) {
                // Rotación del planeta
                planet.rotationY += 0.02 * rotationSpeed;
                
                // Órbita alrededor del sol
                if (planet.distance > 0 && (!dragObject || dragObject !== planet)) {
                    planet.angle += planet.orbitSpeed * rotationSpeed;
                    planet.x = Math.cos(planet.angle) * planet.distance;
                    planet.z = Math.sin(planet.angle) * planet.distance;
                }
            }
            
            // Actualizar lunas
            planet.moons.forEach(moon => {
                moon.angle += moon.orbitSpeed * rotationSpeed;
                moon.x = planet.x + Math.cos(moon.angle) * moon.distance;
                moon.z = planet.z + Math.sin(moon.angle) * moon.distance;
                moon.y = planet.y;
            });
        });
    }
    
    function drawPlanets(p) {
        planets.forEach(planet => {
            p.push();
            p.translate(planet.x, planet.y, planet.z);
            p.rotateY(planet.rotationY);
            
            // Efecto glow para el sol
            if (planet.glow) {
                p.fill(planet.color[0], planet.color[1], planet.color[2], 100);
                p.noStroke();
                p.sphere(planet.size * 1.3);
            }
            
            // Planeta principal
            p.fill(planet.color[0], planet.color[1], planet.color[2]);
            p.noStroke();
            p.sphere(planet.size);
            
            // Anillos de Saturno
            if (planet.hasRings) {
                p.rotateX(p.PI/2);
                p.stroke(200, 200, 200, 150);
                p.strokeWeight(2);
                p.noFill();
                for (let r = planet.size * 1.3; r < planet.size * 2; r += 3) {
                    p.circle(0, 0, r * 2);
                }
                p.rotateX(-p.PI/2);
            }
            
            p.pop();
            
            // Dibujar lunas
            planet.moons.forEach(moon => {
                p.push();
                p.translate(moon.x, moon.y, moon.z);
                p.fill(moon.color[0], moon.color[1], moon.color[2]);
                p.noStroke();
                p.sphere(moon.size);
                p.pop();
            });
        });
    }
    
    function detectPlanetClick(p) {
        // Simplificado: detectar click en planeta basado en distancia 2D
        const mousePos = { x: p.mouseX - p.width/2, y: p.mouseY - p.height/2 };
        
        for (let planet of planets) {
            const screenPos = worldToScreen(planet, p);
            const distance = p.dist(mousePos.x, mousePos.y, screenPos.x, screenPos.y);
            
            if (distance < planet.size * 2) {
                return planet;
            }
        }
        return null;
    }
    
    function detectHover(p) {
        if (!isDragging) {
            const mousePos = { x: p.mouseX - p.width/2, y: p.mouseY - p.height/2 };
            let hoveredPlanet = null;
            
            for (let planet of planets) {
                const screenPos = worldToScreen(planet, p);
                const distance = p.dist(mousePos.x, mousePos.y, screenPos.x, screenPos.y);
                
                if (distance < planet.size * 2) {
                    hoveredPlanet = planet;
                    break;
                }
            }
            
            if (hoveredPlanet) {
                showTooltip(p.mouseX, p.mouseY, hoveredPlanet.name);
            } else {
                hideTooltip();
            }
        }
    }
    
    function worldToScreen(planet, p) {
        // Proyección 3D a 2D simplificada
        const distance = p.dist(0, 0, 0, planet.x, planet.y, planet.z);
        const scale = 200 / (distance + 200);
        return {
            x: planet.x * scale,
            y: planet.z * scale
        };
    }
    
    function showTooltip(x, y, text) {
        tooltip.textContent = text;
        tooltip.style.display = 'block';
        tooltip.style.left = x + 10 + 'px';
        tooltip.style.top = y - 30 + 'px';
    }
    
    function hideTooltip() {
        tooltip.style.display = 'none';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que P5.js esté disponible
    if (typeof p5 !== 'undefined') {
        new p5(sketch3D);
    } else {
        console.error('P5.js no está cargado. Asegúrate de incluir P5.js antes de este script.');
    }
});