import * as THREE from 'three';
import { Planet } from './Planet';
import { PLANETS, SUN_DATA, getScaledRadius, getScaledOrbitRadius } from '../data/PlanetData';
import { PlanetData } from '../types/planet';

export class SolarSystem {
  private scene: THREE.Scene;
  private sun!: THREE.Mesh;
  private sunLight!: THREE.PointLight;
  private planets: Planet[] = [];
  private orbits: THREE.Line[] = [];
  private showOrbits: boolean = true;
  private orbitMode: 'static' | 'trails' = 'static';
  private showDistanceLabels: boolean = false;
  private showCoordinateSystem: boolean = false;
  private showEquinoxMarkers: boolean = false;
  private coordinateSystem: THREE.Group = new THREE.Group();
  private equinoxMarkers: THREE.Group = new THREE.Group();
  private earthSeasonIndicator?: THREE.Group;
  private lastEarthAngle: number = -1;
  private distanceLabels: THREE.Sprite[] = [];
  private distanceLines: THREE.Line[] = [];
  private timeScale: number = 1;
  private currentTime: number = 0;
  private referenceJD: number = 2451545.0; // J2000.0 epoch
  private planetScale: number = 3;
  private camera?: THREE.Camera;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createSun();
    this.createPlanets();
    this.createOrbits();
    this.createDistanceLabels();
    this.createCoordinateSystem();
  }

  private createSun(): void {
    const sunRadius = getScaledRadius(SUN_DATA.radius, true);
    const geometry = new THREE.SphereGeometry(sunRadius, 64, 64);
    
    // Try to load sun texture, fallback to color
    const textureLoader = new THREE.TextureLoader();
    let material: THREE.Material;
    
    try {
      const sunTexture = textureLoader.load(
        '/textures/sun.jpg',
        undefined,
        undefined,
        () => {
          console.warn('Sun texture not found, using color fallback');
        }
      );
      
      material = new THREE.MeshBasicMaterial({
        map: sunTexture,
        color: 0xffffff,
      });
    } catch (error) {
      material = new THREE.MeshBasicMaterial({
        color: SUN_DATA.color,
      });
    }
    
    this.sun = new THREE.Mesh(geometry, material);
    this.sun.position.set(0, 0, 0);
    this.scene.add(this.sun);
    
    // Add sun light
    this.sunLight = new THREE.PointLight(0xffffff, 5, 0, 0);
    this.sunLight.position.set(0, 0, 0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.1;
    this.sunLight.shadow.camera.far = 1000;
    this.scene.add(this.sunLight);
    
    // Create radial gradient texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    
    // Create exponential radial gradient
    const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(255, 255, 100, 1.0)');
    gradient.addColorStop(0.2, 'rgba(255, 220, 80, 0.9)');
    gradient.addColorStop(0.3, 'rgba(255, 180, 60, 0.7)');
    gradient.addColorStop(0.45, 'rgba(255, 140, 40, 0.4)');
    gradient.addColorStop(0.6, 'rgba(255, 100, 30, 0.15)');
    gradient.addColorStop(0.75, 'rgba(255, 80, 20, 0.05)');
    gradient.addColorStop(0.9, 'rgba(255, 60, 15, 0.02)');
    gradient.addColorStop(1, 'rgba(255, 50, 10, 0.0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);
    
    const gradientTexture = new THREE.CanvasTexture(canvas);
    
    // Create billboard sprite for glow that always faces camera
    const spriteMaterial = new THREE.SpriteMaterial({
      map: gradientTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const sunGlow = new THREE.Sprite(spriteMaterial);
    sunGlow.scale.set(sunRadius * 6, sunRadius * 6, 1);
    sunGlow.position.set(0, 0, 0);
    this.scene.add(sunGlow);
  }

  private createPlanets(): void {
    PLANETS.forEach((planetData) => {
      const planet = new Planet(planetData, this.scene, this.planetScale);
      this.planets.push(planet);
    });
  }

  private createOrbits(): void {
    this.createOrbitsForMode();
  }

  private createDistanceLabels(): void {
    // Get sorted orbital radii (including sun at center)
    const orbitalRadii = [0, ...PLANETS.map(p => getScaledOrbitRadius(p.orbitalRadius))].sort((a, b) => a - b);
    
    // Create distance labels and lines between adjacent orbits
    for (let i = 0; i < orbitalRadii.length - 1; i++) {
      const innerRadius = orbitalRadii[i];
      const outerRadius = orbitalRadii[i + 1];
      const distance = outerRadius - innerRadius;
      const middleRadius = (innerRadius + outerRadius) / 2;
      
      // Convert distance back to AU for display
      const distanceAU = distance / 30; // Since getScaledOrbitRadius multiplies by 30
      
      // Create text canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 64;
      
      // Draw text
      context.fillStyle = 'rgba(255, 255, 255, 0.9)';
      context.font = 'bold 20px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(`${distanceAU.toFixed(2)} AU`, 128, 32);
      
      // Create sprite material
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      
      // Create sprite and position it
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(8, 2, 1);
      sprite.position.set(middleRadius, 2, 0); // Slightly above the orbital plane
      sprite.visible = this.showDistanceLabels;
      
      this.distanceLabels.push(sprite);
      this.scene.add(sprite);
      
      // Create line between orbits
      const lineGeometry = new THREE.BufferGeometry();
      const linePoints = [
        new THREE.Vector3(innerRadius, 0, 0),
        new THREE.Vector3(outerRadius, 0, 0)
      ];
      lineGeometry.setFromPoints(linePoints);
      
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.6,
      });
      
      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.visible = this.showDistanceLabels;
      
      this.distanceLines.push(line);
      this.scene.add(line);
      
      // Create arrow at the end of the line
      const arrowGeometry = new THREE.ConeGeometry(0.5, 2, 8);
      const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow.position.set(outerRadius - 1, 0, 0);
      arrow.rotation.z = -Math.PI / 2; // Point right
      arrow.visible = this.showDistanceLabels;
      
      // Store as any to avoid type conflict with Line array
      (this.distanceLines as any[]).push(arrow);
      this.scene.add(arrow);
    }
  }

  public update(delta: number): void {
    // Update sun rotation based on realistic rotation period and time scale
    // Sun rotates once every 24.47 days at the equator
    const sunRotationRate = (2 * Math.PI) / (SUN_DATA.rotationPeriod * 24 * 3600); // radians per second
    this.sun.rotation.y += delta * this.timeScale * sunRotationRate;
    
    // Update time
    this.currentTime += delta * this.timeScale;
    
    // Update planets
    this.planets.forEach((planet) => {
      planet.update(delta, this.currentTime);
    });
    
    // Update orbit trails if in trail mode
    if (this.showOrbits && this.orbitMode === 'trails') {
      this.updateOrbitTrails();
    }
    
    // Update static orbit shading based on camera position
    if (this.showOrbits && this.orbitMode === 'static' && this.camera) {
      this.updateStaticOrbitShading();
    }
    
    // Update Earth season indicator
    // this.updateEarthSeasonIndicator(); // Temporarily disabled for performance
  }
  
  private updateStaticOrbitShading(): void {
    if (!this.camera) return;
    
    const cameraPos = this.camera.position;
    const cameraAngle = Math.atan2(cameraPos.z, cameraPos.x);
    
    // Calculate overall camera distance from origin (sun)
    const cameraDistFromSun = Math.sqrt(
      cameraPos.x * cameraPos.x + 
      cameraPos.y * cameraPos.y + 
      cameraPos.z * cameraPos.z
    );
    
    this.orbits.forEach((orbit) => {
      if (orbit.userData.mode !== 'static') return;
      
      const geometry = orbit.userData.geometry as THREE.BufferGeometry;
      const material = orbit.userData.material as THREE.ShaderMaterial;
      const orbitRadius = orbit.userData.orbitRadius;
      
      if (!geometry || !material) return;
      
      const colorAttribute = geometry.getAttribute('color') as THREE.BufferAttribute;
      const opacityAttribute = geometry.getAttribute('opacity') as THREE.BufferAttribute;
      
      if (!colorAttribute || !opacityAttribute) return;
      
      const colors = colorAttribute.array as Float32Array;
      const opacities = opacityAttribute.array as Float32Array;
      const segments = 200;
      
      // Adaptive scaling based on camera distance
      // When zoomed out, use relative distances; when zoomed in, use absolute
      const zoomFactor = Math.min(1.0, cameraDistFromSun / 200);
      const relativeScale = Math.max(50, cameraDistFromSun * 0.5); // Adaptive scale for distance calculations
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        
        // Calculate point position
        const pointX = Math.cos(angle) * orbitRadius;
        const pointZ = Math.sin(angle) * orbitRadius;
        
        // Calculate actual distance from camera to this point
        const distToCamera = Math.sqrt(
          (pointX - cameraPos.x) * (pointX - cameraPos.x) + 
          (pointZ - cameraPos.z) * (pointZ - cameraPos.z) +
          cameraPos.y * cameraPos.y
        );
        
        // Relative distance normalized by camera distance to maintain consistent depth perception
        const normalizedDist = distToCamera / relativeScale;
        
        // Distance factor that adapts to zoom level
        // Use smoother falloff and maintain minimum visibility
        const distanceFactor = Math.max(0.5, Math.exp(-normalizedDist * 0.5));
        
        // Depth factor based on angle relative to camera (front vs back of orbit)
        const relativeAngle = angle - cameraAngle;
        const angleFactor = Math.cos(relativeAngle) * 0.3 + 0.7; // 0.4 to 1.0 range
        
        // Combine factors
        const combinedFactor = distanceFactor * angleFactor;
        
        // Boost factor for distant viewing to maintain visibility
        const visibilityBoost = Math.min(1.5, 1.0 + zoomFactor * 0.5);
        
        // Base color with adaptive brightness
        const baseR = 0.5;
        const baseG = 0.6;
        const baseB = 0.8;
        
        colors[i * 3] = baseR * combinedFactor * visibilityBoost;
        colors[i * 3 + 1] = baseG * combinedFactor * visibilityBoost;
        colors[i * 3 + 2] = baseB * combinedFactor * visibilityBoost;
        
        // Maintain better opacity range for visibility
        opacities[i] = 0.35 + combinedFactor * 0.4; // Ranges from 0.35 to 0.75
      }
      
      colorAttribute.needsUpdate = true;
      opacityAttribute.needsUpdate = true;
    });
  }
  
  private updateOrbitTrails(): void {
    this.orbits.forEach((orbit, index) => {
      const userData = orbit.userData;
      
      // Only update orbits that are in trail mode
      if (!userData || userData.mode !== 'trails') return;
      
      const planet = this.planets[index];
      const geometry = orbit.geometry as THREE.BufferGeometry;
      const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
      
      if (!positionAttribute) return;
      
      // Get current planet position in orbit's local space
      const planetPos = planet.getPosition();
      
      // Transform planet position to orbit's local coordinate system
      const orbitInverse = new THREE.Matrix4().copy(orbit.matrixWorld).invert();
      const localPlanetPos = planetPos.clone().applyMatrix4(orbitInverse);
      
      // Initialize trail points array if it doesn't exist
      if (!userData.trailPoints || userData.trailPoints.length === 0) {
        userData.trailPoints = [];
        for (let i = 0; i < userData.trailLength; i++) {
          userData.trailPoints.push(localPlanetPos.clone());
        }
      }
      
      // Add current planet position to the beginning of the trail
      userData.trailPoints.unshift(localPlanetPos.clone());
      
      // Keep only the specified trail length
      if (userData.trailPoints.length > userData.trailLength) {
        userData.trailPoints = userData.trailPoints.slice(0, userData.trailLength);
      }
      
      // Update the geometry with the trail points
      const positions = positionAttribute.array as Float32Array;
      for (let i = 0; i < Math.min(userData.trailPoints.length, userData.trailLength); i++) {
        const point = userData.trailPoints[i];
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      }
      
      positionAttribute.needsUpdate = true;
    });
  }
  
  public setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  public setTimeScale(scale: number): void {
    this.timeScale = scale;
  }

  public setReferenceDate(julianDay: number): void {
    this.referenceJD = julianDay;
    // Reset current time to start from the new reference date
    this.currentTime = 0;
    
    // Update all planets to use the new reference date
    this.planets.forEach((planet) => {
      planet.setReferenceDate(julianDay);
    });
  }

  public setShowOrbits(show: boolean): void {
    this.showOrbits = show;
    this.orbits.forEach(orbit => {
      orbit.visible = show;
    });
  }

  public setOrbitMode(mode: 'static' | 'trails'): void {
    this.orbitMode = mode;
    this.recreateOrbits();
  }

  private recreateOrbits(): void {
    // Remove existing orbits
    this.orbits.forEach(orbit => {
      this.scene.remove(orbit);
      if (orbit.geometry) orbit.geometry.dispose();
      if (orbit.material && 'dispose' in orbit.material) {
        (orbit.material as THREE.Material).dispose();
      }
    });
    this.orbits = [];
    
    // Create new orbits with current mode
    this.createOrbitsForMode();
  }

  private createOrbitsForMode(): void {
    PLANETS.forEach((planetData) => {
      const orbitRadius = getScaledOrbitRadius(planetData.orbitalRadius);
      
      if (this.orbitMode === 'static') {
        this.createStaticOrbit(planetData, orbitRadius);
      } else {
        this.createTrailOrbit(planetData, orbitRadius);
      }
    });
  }

  private createStaticOrbit(planetData: any, orbitRadius: number): void {
    const segments = 200;
    
    // Create points for the full orbit - flat in XZ plane for coordinate system look
    const fullOrbitPoints = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * orbitRadius;
      const z = Math.sin(angle) * orbitRadius;
      fullOrbitPoints.push(new THREE.Vector3(x, 0, z)); // Keep Y=0 for flat orbit
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(fullOrbitPoints);
    
    // Enhanced depth-based shading for static orbits
    const colors = new Float32Array(fullOrbitPoints.length * 3);
    const opacities = new Float32Array(fullOrbitPoints.length);
    
    for (let i = 0; i < fullOrbitPoints.length; i++) {
      const angle = (i / segments) * Math.PI * 2;
      
      // Calculate depth factor based on Z position (front/back relative to viewer)
      // Front parts (negative Z) are brighter, back parts (positive Z) are dimmer
      const depthFactor = Math.sin(angle) * 0.4 + 0.6; // Ranges from 0.2 to 1.0
      
      // Apply distance-based fade from sun
      const distanceFade = 1.0 - (orbitRadius / 600) * 0.3; // Fade based on orbit size
      
      // Base color with depth modulation
      const baseR = 0.5;
      const baseG = 0.6;
      const baseB = 0.8;
      
      colors[i * 3] = baseR * depthFactor * distanceFade;     // Red
      colors[i * 3 + 1] = baseG * depthFactor * distanceFade; // Green  
      colors[i * 3 + 2] = baseB * depthFactor * distanceFade; // Blue
      
      // Variable opacity for additional depth cue
      opacities[i] = 0.3 + depthFactor * 0.4; // Ranges from 0.3 to 0.7
    }
    
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    
    // Custom shader material for per-vertex opacity
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float opacity;
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          vColor = color;
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        
        void main() {
          gl_FragColor = vec4(vColor, vOpacity);
        }
      `,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    
    const orbit = new THREE.Line(geometry, material);
    // Store original material for dynamic updates
    orbit.userData = { 
      orbitRadius: orbitRadius,
      planetName: planetData.name,
      mode: 'static',
      material: material,
      geometry: geometry
    };
    
    // Don't apply inclination for static orbits to keep them flat like a coordinate system
    orbit.visible = this.showOrbits;
    
    this.orbits.push(orbit);
    this.scene.add(orbit);
  }

  private createTrailOrbit(planetData: any, orbitRadius: number): void {
    const trailLength = 60;
    
    // Create initial trail points (will be updated dynamically)
    const trailPoints = [];
    for (let i = 0; i < trailLength; i++) {
      trailPoints.push(new THREE.Vector3(0, 0, 0));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
    
    // Initialize vertex colors array for trail effect
    const colors = new Float32Array(trailLength * 3);
    for (let i = 0; i < trailLength; i++) {
      const alpha = 1.0 - (i / trailLength); // Fade from 1 to 0 (newest to oldest)
      colors[i * 3] = alpha * 0.7;     // Red
      colors[i * 3 + 1] = alpha * 0.8; // Green  
      colors[i * 3 + 2] = alpha;       // Blue
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      linewidth: 2,
    });
    
    const orbit = new THREE.Line(geometry, material);
    orbit.rotation.x = THREE.MathUtils.degToRad(planetData.inclination);
    orbit.visible = this.showOrbits;
    orbit.userData = { 
      orbitRadius: orbitRadius,
      planetName: planetData.name,
      trailLength: trailLength,
      trailPoints: [],
      mode: 'trails'
    };
    
    this.orbits.push(orbit);
    this.scene.add(orbit);
  }

  public setShowDistanceLabels(show: boolean): void {
    this.showDistanceLabels = show;
    this.distanceLabels.forEach(label => {
      label.visible = show;
    });
    this.distanceLines.forEach(line => {
      line.visible = show;
    });
  }

  public setShowCoordinateSystem(show: boolean): void {
    this.showCoordinateSystem = show;
    this.coordinateSystem.visible = show;
    if (this.earthSeasonIndicator) {
      this.earthSeasonIndicator.visible = show;
    }
  }

  public setShowEquinoxMarkers(show: boolean): void {
    this.showEquinoxMarkers = show;
    this.equinoxMarkers.visible = show;
  }

  public setEnableShadows(enable: boolean): void {
    // Update sun light shadow casting
    this.sunLight.castShadow = enable;
    
    // Update all planets to cast/receive shadows
    this.planets.forEach(planet => {
      planet.setEnableShadows(enable);
    });
    
    // Update sun shadow receiving
    this.sun.receiveShadow = enable;
  }

  public setShowEarthAxis(show: boolean): void {
    const earth = this.planets.find(p => p.name === 'Earth');
    if (earth) {
      earth.setShowEarthAxis(show);
    }
  }

  public setShowEarthPoles(show: boolean): void {
    const earth = this.planets.find(p => p.name === 'Earth');
    if (earth) {
      earth.setShowEarthPoles(show);
    }
  }

  public setShowEarthEquator(show: boolean): void {
    const earth = this.planets.find(p => p.name === 'Earth');
    if (earth) {
      earth.setShowEarthEquator(show);
    }
  }

  public setShowMoons(show: boolean): void {
    this.planets.forEach(planet => {
      planet.setShowMoons(show);
    });
  }

  private createCoordinateSystem(): void {
    this.coordinateSystem = new THREE.Group();
    this.coordinateSystem.visible = this.showCoordinateSystem;
    
    // Create ecliptic plane grid (XZ plane - fundamental plane for solar system)
    this.createEclipticPlane();
    
    // Create celestial equator (inclined 23.4° to ecliptic)
    this.createCelestialEquator();
    
    // Create coordinate axes
    this.createCoordinateAxes();
    
    this.scene.add(this.coordinateSystem);
    
    // Create equinox and solstice markers as separate system
    this.createEquinoxSolsticeMarkers();
    this.equinoxMarkers.visible = this.showEquinoxMarkers;
    this.scene.add(this.equinoxMarkers);
    
    // Create Earth position and season indicator
    // this.createEarthSeasonIndicator(); // Temporarily disabled for performance
  }

  private createEclipticPlane(): void {
    // Create a grid representing the ecliptic plane (full solar system scale)
    const gridSize = 600; // Large enough to show outer planets
    const divisions = 24; // 24 divisions for 15° increments
    
    // Create main grid lines
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    // Longitude lines (radial from sun)
    for (let i = 0; i <= divisions; i++) {
      const angle = (i / divisions) * Math.PI * 2;
      const x1 = Math.cos(angle) * 50; // Inner radius
      const z1 = Math.sin(angle) * 50;
      const x2 = Math.cos(angle) * gridSize;
      const z2 = Math.sin(angle) * gridSize;
      
      positions.push(x1, 0, z1, x2, 0, z2);
    }
    
    // Latitude circles (concentric circles)
    const radiusSteps = [50, 100, 150, 200, 300, 400, 500, 600];
    radiusSteps.forEach(radius => {
      const segments = 64;
      for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;
        
        positions.push(
          Math.cos(angle1) * radius, 0, Math.sin(angle1) * radius,
          Math.cos(angle2) * radius, 0, Math.sin(angle2) * radius
        );
      }
    });
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: 0x444466,
      transparent: true,
      opacity: 0.3
    });
    
    const eclipticGrid = new THREE.LineSegments(geometry, material);
    this.coordinateSystem.add(eclipticGrid);
    
    // Add ecliptic plane label
    this.addPlaneLabel('Ecliptic Plane\n(Solar System)', new THREE.Vector3(400, 5, 0), 0x444466);
  }

  private createCelestialEquator(): void {
    // Create celestial equator (inclined 23.4° to ecliptic)
    const radius = 500; // Large scale to match solar system
    const segments = 200;
    
    // Create a simple continuous line for the celestial equator
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, 0, z));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Use LineDashedMaterial for efficient dashed line rendering
    const material = new THREE.LineDashedMaterial({
      color: 0x66dd88,
      transparent: true,
      opacity: 0.8,
      linewidth: 3,
      dashSize: 10,
      gapSize: 5,
    });
    
    const celestialEquator = new THREE.Line(geometry, material);
    celestialEquator.computeLineDistances(); // Required for dashed lines
    
    // Apply 23.4° inclination to ecliptic
    celestialEquator.rotation.x = THREE.MathUtils.degToRad(23.4);
    
    this.coordinateSystem.add(celestialEquator);
    
    // Add a subtle plane to show the celestial equator plane
    const planeGeometry = new THREE.RingGeometry(480, 500, 64);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x66aa44,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    const celestialPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    celestialPlane.rotation.x = THREE.MathUtils.degToRad(23.4);
    this.coordinateSystem.add(celestialPlane);
    
    
    // Add celestial equator label
    this.addPlaneLabel('Celestial Equator\n(Earth Equator)', new THREE.Vector3(350, 50, 0), 0x66aa44);
  }

  private createCoordinateAxes(): void {
    // Create coordinate axes with labels
    const axisLength = 400;
    
    // X-axis (Vernal Equinox direction)
    const xGeometry = new THREE.BufferGeometry();
    xGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-axisLength, 0, 0, axisLength, 0, 0], 3));
    const xMaterial = new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 3 });
    const xAxis = new THREE.Line(xGeometry, xMaterial);
    this.coordinateSystem.add(xAxis);
    
    // Z-axis (90° from vernal equinox)
    const zGeometry = new THREE.BufferGeometry();
    zGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -axisLength, 0, 0, axisLength], 3));
    const zMaterial = new THREE.LineBasicMaterial({ color: 0x4444ff, linewidth: 3 });
    const zAxis = new THREE.Line(zGeometry, zMaterial);
    this.coordinateSystem.add(zAxis);
    
    // Y-axis (North ecliptic pole)
    const yGeometry = new THREE.BufferGeometry();
    yGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, -200, 0, 0, 200, 0], 3));
    const yMaterial = new THREE.LineBasicMaterial({ color: 0x44ff44, linewidth: 3 });
    const yAxis = new THREE.Line(yGeometry, yMaterial);
    this.coordinateSystem.add(yAxis);
    
    // Add axis labels
    this.addAxisLabel('Vernal Equinox\n(0° Ecliptic Longitude)', new THREE.Vector3(axisLength + 20, 0, 0), 0xff4444);
    this.addAxisLabel('90° Ecliptic Longitude', new THREE.Vector3(0, 0, axisLength + 20), 0x4444ff);
    this.addAxisLabel('North Ecliptic Pole', new THREE.Vector3(0, 200 + 20, 0), 0x44ff44);
  }

  private addPlaneLabel(text: string, position: THREE.Vector3, color: number): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 200; // Smaller canvas
    canvas.height = 48;  // Smaller height
    
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = 'bold 12px Arial'; // Smaller font
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Handle multi-line text
    const lines = text.split('\n');
    if (lines.length > 1) {
      lines.forEach((line, index) => {
        context.fillText(line, 100, 16 + index * 16); // Tighter spacing
      });
    } else {
      context.fillText(text, 100, 24);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(25, 6, 1); // Smaller sprite scale
    sprite.position.copy(position);
    
    this.coordinateSystem.add(sprite);
  }

  private addAxisLabel(text: string, position: THREE.Vector3, color: number): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 160; // Smaller
    canvas.height = 40;  // Smaller
    
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = 'bold 11px Arial'; // Smaller font
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Handle multi-line text
    const lines = text.split('\n');
    if (lines.length > 1) {
      lines.forEach((line, index) => {
        context.fillText(line, 80, 12 + index * 16); // Tighter spacing
      });
    } else {
      context.fillText(text, 80, 20);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(20, 5, 1); // Smaller sprite scale
    sprite.position.copy(position);
    
    this.coordinateSystem.add(sprite);
  }

  private addEquinoxLabel(text: string, position: THREE.Vector3, color: number): void {
    const sprite = this.createEquinoxLabelSprite(text, color);
    sprite.position.copy(position);
    this.equinoxMarkers.add(sprite);
  }

  private createEquinoxLabelSprite(text: string, color: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 120; // Very small
    canvas.height = 32;
    
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = 'bold 10px Arial'; // Very small font
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Handle multi-line text
    const lines = text.split('\n');
    if (lines.length > 1) {
      lines.forEach((line, index) => {
        context.fillText(line, 60, 10 + index * 12);
      });
    } else {
      context.fillText(text, 60, 16);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(12, 3, 1); // Very small sprite scale
    
    return sprite;
  }

  private createEquinoxSolsticeMarkers(): void {
    const radius = 30; // Earth's orbital radius
    const earthSize = 1; // Earth's scaled radius from getScaledRadius
    
    // Vernal Equinox (0°) - where celestial equator crosses ecliptic going north
    const vernalSphere = new THREE.Mesh(
      new THREE.SphereGeometry(earthSize, 16, 16), // Same size as Earth
      new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0.9 })
    );
    vernalSphere.position.set(radius, 0, 0);
    this.equinoxMarkers.add(vernalSphere);
    
    // Autumnal Equinox (180°) - where celestial equator crosses ecliptic going south
    const autumnalSphere = new THREE.Mesh(
      new THREE.SphereGeometry(earthSize, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9 })
    );
    autumnalSphere.position.set(-radius, 0, 0);
    this.equinoxMarkers.add(autumnalSphere);
    
    // Summer Solstice (90°) - Sun at maximum northern declination
    const summerSphere = new THREE.Mesh(
      new THREE.SphereGeometry(earthSize, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff6666, transparent: true, opacity: 0.9 })
    );
    summerSphere.position.set(0, 0, radius);
    this.equinoxMarkers.add(summerSphere);
    
    // Winter Solstice (270°) - Sun at maximum southern declination
    const winterSphere = new THREE.Mesh(
      new THREE.SphereGeometry(earthSize, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x6666ff, transparent: true, opacity: 0.9 })
    );
    winterSphere.position.set(0, 0, -radius);
    this.equinoxMarkers.add(winterSphere);
    
    // Add Y-axis showing north/south celestial poles (perpendicular to celestial equator)
    const yAxisLength = 25; // Shorter than orbital radius
    const celestialPoleGroup = new THREE.Group();
    
    // Create the axis line
    const yGeometry = new THREE.BufferGeometry();
    yGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, -yAxisLength, 0, 0, yAxisLength, 0], 3));
    const yMaterial = new THREE.LineBasicMaterial({ color: 0xff8844, linewidth: 2, transparent: true, opacity: 0.8 }); // Orange color to distinguish from ecliptic pole
    const yAxis = new THREE.Line(yGeometry, yMaterial);
    celestialPoleGroup.add(yAxis);
    
    // Add labels at the endpoints (before rotation)
    const northPoleLabel = this.createEquinoxLabelSprite('N. Celestial\nPole', 0xff8844);
    northPoleLabel.position.set(1, yAxisLength + 1, 0);
    celestialPoleGroup.add(northPoleLabel);
    
    const southPoleLabel = this.createEquinoxLabelSprite('S. Celestial\nPole', 0xff8844);
    southPoleLabel.position.set(1, -yAxisLength - 1, 0);
    celestialPoleGroup.add(southPoleLabel);
    
    // Rotate the entire group by 23.4° to align with celestial equator
    celestialPoleGroup.rotation.x = THREE.MathUtils.degToRad(23.4);
    this.equinoxMarkers.add(celestialPoleGroup);
    
    // Add Z-axis between summer and winter solstices (solstice line)
    const zGeometry = new THREE.BufferGeometry();
    zGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -radius, 0, 0, radius], 3));
    const zMaterial = new THREE.LineBasicMaterial({ color: 0x8888ff, linewidth: 2, transparent: true, opacity: 0.8 });
    const zAxis = new THREE.Line(zGeometry, zMaterial);
    this.equinoxMarkers.add(zAxis);
    
    // Add angle indicator showing 23.4° tilt between ecliptic pole and celestial pole
    const angleRadius = 12;
    const angleSegments = 25;
    const anglePoints = [];
    
    // Create arc showing the angle from vertical (ecliptic pole) to celestial pole
    for (let i = 0; i <= angleSegments; i++) {
      const angle = (i / angleSegments) * THREE.MathUtils.degToRad(23.4);
      const y = Math.cos(angle) * angleRadius; // Start from vertical
      const z = Math.sin(angle) * angleRadius; // Move toward celestial pole direction
      anglePoints.push(new THREE.Vector3(0, y, z));
    }
    
    const angleArcGeometry = new THREE.BufferGeometry().setFromPoints(anglePoints);
    const angleArcMaterial = new THREE.LineBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.9,
      linewidth: 3
    });
    
    const angleArc = new THREE.Line(angleArcGeometry, angleArcMaterial);
    this.equinoxMarkers.add(angleArc);
    
    // Add reference line showing ecliptic pole (straight up)
    const eclipticPoleGeometry = new THREE.BufferGeometry();
    eclipticPoleGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, angleRadius, 0], 3));
    const eclipticPoleMaterial = new THREE.LineBasicMaterial({ 
      color: 0x888888, 
      linewidth: 1, 
      transparent: true, 
      opacity: 0.6,
      lineDashed: true,
      dashSize: 2,
      gapSize: 1
    });
    const eclipticPoleLine = new THREE.Line(eclipticPoleGeometry, eclipticPoleMaterial);
    eclipticPoleLine.computeLineDistances(); // Required for dashed lines
    this.equinoxMarkers.add(eclipticPoleLine);
    
    // Add smaller labels positioned closer to markers
    this.addEquinoxLabel('Vernal\nEquinox', new THREE.Vector3(radius + 3, 3, 0), 0xffdd00);
    this.addEquinoxLabel('Autumnal\nEquinox', new THREE.Vector3(-radius - 3, 3, 0), 0xffaa00);
    this.addEquinoxLabel('Summer\nSolstice', new THREE.Vector3(3, 3, radius + 3), 0xff6666);
    this.addEquinoxLabel('Winter\nSolstice', new THREE.Vector3(3, 3, -radius - 3), 0x6666ff);
    
    // Add solstice axis label (closer)
    this.addEquinoxLabel('Solstice\nAxis', new THREE.Vector3(0, 5, 0), 0x8888ff);
    
    // Add angle label (closer)
    this.addEquinoxLabel('23.4°\nTilt', new THREE.Vector3(3, angleRadius - 3, 2), 0xffaa00);
    
    // Intersection line showing where celestial equator meets ecliptic
    const intersectionGeometry = new THREE.BufferGeometry();
    const intersectionPoints = [
      new THREE.Vector3(-radius, 0, 0),
      new THREE.Vector3(radius, 0, 0)
    ];
    intersectionGeometry.setFromPoints(intersectionPoints);
    
    const intersectionMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
      linewidth: 3
    });
    
    const intersectionLine = new THREE.Line(intersectionGeometry, intersectionMaterial);
    this.equinoxMarkers.add(intersectionLine);
  }

  private createEarthSeasonIndicator(): void {
    this.earthSeasonIndicator = new THREE.Group();
    
    // Create a visual indicator for Earth's position
    const indicatorGeometry = new THREE.ConeGeometry(15, 30, 8);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8
    });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.rotation.x = Math.PI / 2; // Point downward
    indicator.position.y = 40; // Above Earth's orbit
    
    this.earthSeasonIndicator.add(indicator);
    
    // Add season label sprite
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    
    const seasonLabel = new THREE.Sprite(spriteMaterial);
    seasonLabel.scale.set(40, 10, 1);
    seasonLabel.position.y = 60;
    seasonLabel.userData = { canvas, context };
    
    this.earthSeasonIndicator.add(seasonLabel);
    this.earthSeasonIndicator.visible = this.showCoordinateSystem;
    
    this.scene.add(this.earthSeasonIndicator);
  }

  private updateEarthSeasonIndicator(): void {
    if (!this.earthSeasonIndicator || !this.showCoordinateSystem) return;
    
    // Find Earth
    const earth = this.planets.find(p => p.getPlanetData().name === 'Earth');
    if (!earth) return;
    
    // Get Earth's current position
    const earthPos = earth.getPosition();
    
    // Update indicator position to follow Earth (this is cheap)
    this.earthSeasonIndicator.position.x = earthPos.x;
    this.earthSeasonIndicator.position.z = earthPos.z;
    
    // Calculate Earth's angle in its orbit (0° at vernal equinox)
    const angle = Math.atan2(earthPos.z, earthPos.x);
    let degrees = THREE.MathUtils.radToDeg(angle);
    if (degrees < 0) degrees += 360;
    
    // Only update the expensive canvas rendering if angle changed significantly
    const angleDiff = Math.abs(degrees - this.lastEarthAngle);
    if (angleDiff < 5 && this.lastEarthAngle !== -1) return; // Update only every 5 degrees
    
    this.lastEarthAngle = degrees;
    
    // Determine current season based on Earth's position
    let season = '';
    let seasonColor = 0x00ff00;
    
    if (degrees >= 345 || degrees < 15) {
      season = 'Near Vernal Equinox\nN. Hemisphere: Spring begins';
      seasonColor = 0xffdd00;
    } else if (degrees >= 15 && degrees < 75) {
      season = 'N. Hemisphere: Spring\nS. Hemisphere: Autumn';
      seasonColor = 0x88ff88;
    } else if (degrees >= 75 && degrees < 105) {
      season = 'Near Summer Solstice\nN. Hemisphere: Summer begins';
      seasonColor = 0xff6666;
    } else if (degrees >= 105 && degrees < 165) {
      season = 'N. Hemisphere: Summer\nS. Hemisphere: Winter';
      seasonColor = 0xffaa88;
    } else if (degrees >= 165 && degrees < 195) {
      season = 'Near Autumnal Equinox\nN. Hemisphere: Autumn begins';
      seasonColor = 0xffaa00;
    } else if (degrees >= 195 && degrees < 255) {
      season = 'N. Hemisphere: Autumn\nS. Hemisphere: Spring';
      seasonColor = 0xcc8844;
    } else if (degrees >= 255 && degrees < 285) {
      season = 'Near Winter Solstice\nN. Hemisphere: Winter begins';
      seasonColor = 0x6666ff;
    } else {
      season = 'N. Hemisphere: Winter\nS. Hemisphere: Summer';
      seasonColor = 0x8888ff;
    }
    
    // Update indicator color
    const indicator = this.earthSeasonIndicator.children[0] as THREE.Mesh;
    if (indicator.material && 'color' in indicator.material) {
      (indicator.material as THREE.MeshBasicMaterial).color.setHex(seasonColor);
    }
    
    // Update season label
    const seasonLabel = this.earthSeasonIndicator.children[1] as THREE.Sprite;
    if (seasonLabel && seasonLabel.userData.canvas && seasonLabel.userData.context) {
      const canvas = seasonLabel.userData.canvas;
      const context = seasonLabel.userData.context;
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw season text
      context.fillStyle = `#${seasonColor.toString(16).padStart(6, '0')}`;
      context.font = 'bold 14px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      
      const lines = season.split('\n');
      lines.forEach((line, index) => {
        context.fillText(line, 128, 20 + index * 24);
      });
      
      // Update texture
      if (seasonLabel.material && 'map' in seasonLabel.material) {
        (seasonLabel.material as THREE.SpriteMaterial).map!.needsUpdate = true;
      }
    }
  }

  public setPlanetScale(scale: number): void {
    this.planetScale = scale;
    this.planets.forEach(planet => {
      planet.setScale(scale);
    });
  }

  public setRealisticScale(realistic: boolean): void {
    this.planets.forEach(planet => {
      planet.setRealisticScale(realistic);
    });
  }

  public getPlanetMeshes(): THREE.Object3D[] {
    return this.planets.map(p => p.getMesh());
  }

  public getAllMoonMeshes(): THREE.Object3D[] {
    const allMoons: THREE.Object3D[] = [];
    this.planets.forEach(planet => {
      allMoons.push(...planet.getMoons());
    });
    return allMoons;
  }

  public getMoonByMesh(mesh: THREE.Object3D): { moon: any, planet: Planet } | undefined {
    for (const planet of this.planets) {
      const moon = planet.getMoons().find(m => m === mesh);
      if (moon && moon.userData?.moon) {
        return { moon: moon.userData.moon, planet };
      }
    }
    return undefined;
  }

  public getPlanetByMesh(mesh: THREE.Object3D): Planet | undefined {
    return this.planets.find(p => p.getMesh() === mesh);
  }

  public getPlanetData(name: string): PlanetData | undefined {
    return PLANETS.find(p => p.name === name);
  }

  public getPlanets(): Planet[] {
    return this.planets;
  }

  public getSun(): THREE.Mesh {
    return this.sun;
  }

  public getSunData() {
    return SUN_DATA;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }
}