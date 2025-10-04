"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Home() {
  const mountRef = useRef(null);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    // Increase shadow camera bounds
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Infinite terrain system
    const planeSize = 50;
    const planes = [];
    const grids = [];

    function createPlane(zPosition) {
      // Create ground plane
      const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        roughness: 0.8,
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.rotation.x = -Math.PI / 2;
      plane.position.z = zPosition;
      plane.receiveShadow = true;
      scene.add(plane);

      // Create grid helper (slightly above plane to prevent z-fighting)
      const gridHelper = new THREE.GridHelper(
        planeSize,
        50,
        0x444444,
        0x888888
      );
      gridHelper.position.y = 0.01; // Raise slightly above the plane
      gridHelper.position.z = zPosition;
      scene.add(gridHelper);

      return { plane, grid: gridHelper, zPosition };
    }

    // Initialize with several planes
    for (let i = 1; i >= -2; i--) {
      const planeData = createPlane(i * planeSize);
      planes.push(planeData);
      grids.push(planeData.grid);
    }

    // Create tracked military vehicle
    const carGroup = new THREE.Group();

    // Vehicle materials - matching the beige/tan military vehicle
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xc9b896, // Beige/tan hull color
      roughness: 0.6,
      metalness: 0.3,
    });

    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, // Black tracks
      roughness: 0.9,
      metalness: 0.2,
    });

    const detailMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a, // Dark gray weapon system and details
      roughness: 0.6,
      metalness: 0.5,
    });

    // Main hull (lower body)
    const hullGeometry = new THREE.BoxGeometry(2.8, 0.8, 4.5);
    const body = new THREE.Mesh(hullGeometry, bodyMaterial);
    body.position.y = 1.2;
    body.castShadow = true;
    carGroup.add(body);

    // Upper hull section with angled sides
    const upperHullGeometry = new THREE.BoxGeometry(2.4, 0.6, 3.5);
    const upperHull = new THREE.Mesh(upperHullGeometry, bodyMaterial);
    upperHull.position.y = 1.9;
    upperHull.castShadow = true;
    carGroup.add(upperHull);

    // Side armor panels
    const sideArmorGeometry = new THREE.BoxGeometry(0.1, 1, 4.2);
    const leftArmor = new THREE.Mesh(sideArmorGeometry, detailMaterial);
    leftArmor.position.set(-1.5, 1.2, 0);
    leftArmor.castShadow = true;
    carGroup.add(leftArmor);

    const rightArmor = new THREE.Mesh(sideArmorGeometry, detailMaterial);
    rightArmor.position.set(1.5, 1.2, 0);
    rightArmor.castShadow = true;
    carGroup.add(rightArmor);

    // Track system (treads)
    const legs = {}; // Keep for animation compatibility

    // Left track
    const leftTrackGeometry = new THREE.BoxGeometry(0.5, 0.7, 5);
    const leftTrack = new THREE.Mesh(leftTrackGeometry, trackMaterial);
    leftTrack.position.set(-1.65, 0.6, 0);
    leftTrack.castShadow = true;
    carGroup.add(leftTrack);

    // Right track
    const rightTrack = new THREE.Mesh(leftTrackGeometry, trackMaterial);
    rightTrack.position.set(1.65, 0.6, 0);
    rightTrack.castShadow = true;
    carGroup.add(rightTrack);

    // Track wheels (road wheels)
    const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.3,
    });

    for (let side = -1; side <= 1; side += 2) {
      for (let i = -2; i <= 2; i++) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * 1.65, 0.4, i * 1);
        wheel.castShadow = true;
        carGroup.add(wheel);
      }
    }

    // Front idler wheels
    for (let side = -1; side <= 1; side += 2) {
      const idler = new THREE.Mesh(wheelGeometry, wheelMaterial);
      idler.rotation.z = Math.PI / 2;
      idler.position.set(side * 1.65, 0.7, 2.7);
      idler.castShadow = true;
      carGroup.add(idler);
    }

    // Rear drive wheels
    for (let side = -1; side <= 1; side += 2) {
      const drive = new THREE.Mesh(wheelGeometry, wheelMaterial);
      drive.rotation.z = Math.PI / 2;
      drive.position.set(side * 1.65, 0.7, -2.7);
      drive.castShadow = true;
      carGroup.add(drive);
    }

    // Weapon mount base
    const mountBaseGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 16);
    const mountBase = new THREE.Mesh(mountBaseGeometry, detailMaterial);
    mountBase.position.y = 2.35;
    mountBase.position.z = 0.5;
    mountBase.castShadow = true;
    carGroup.add(mountBase);

    // Weapon turret platform
    const turretPlatformGeometry = new THREE.BoxGeometry(1, 0.4, 1);
    const turretPlatform = new THREE.Mesh(turretPlatformGeometry, bodyMaterial);
    turretPlatform.position.y = 2.65;
    turretPlatform.position.z = 0.5;
    turretPlatform.castShadow = true;
    carGroup.add(turretPlatform);

    // Weapon system box (like in image)
    const weaponBoxGeometry = new THREE.BoxGeometry(0.8, 0.6, 1.2);
    const weaponBox = new THREE.Mesh(weaponBoxGeometry, detailMaterial);
    weaponBox.position.y = 3.15;
    weaponBox.position.z = 0.5;
    weaponBox.castShadow = true;
    carGroup.add(weaponBox);

    // Gun barrel - larger like in the image
    const barrelGeometry = new THREE.CylinderGeometry(0.12, 0.12, 2.5, 16);
    const barrel = new THREE.Mesh(barrelGeometry, detailMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.rotation.y = Math.PI;
    barrel.position.set(0, 3.15, -1.8);
    barrel.castShadow = true;
    carGroup.add(barrel);

    // Gun barrel tip
    const barrelTipGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.3, 16);
    const barrelTip = new THREE.Mesh(barrelTipGeometry, detailMaterial);
    barrelTip.rotation.x = Math.PI / 2;
    barrelTip.rotation.y = Math.PI;
    barrelTip.position.set(0, 3.15, -3.2);
    barrelTip.castShadow = true;
    carGroup.add(barrelTip);

    // Muzzle flash (initially hidden)
    const muzzleFlashGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const muzzleFlashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0,
    });
    const muzzleFlash = new THREE.Mesh(
      muzzleFlashGeometry,
      muzzleFlashMaterial
    );
    muzzleFlash.position.set(0, 3.15, -3.6);
    carGroup.add(muzzleFlash);

    // Sensor/camera boxes on top
    const sensorGeometry = new THREE.BoxGeometry(0.25, 0.3, 0.25);
    const sensor1 = new THREE.Mesh(sensorGeometry, detailMaterial);
    sensor1.position.set(-0.3, 3.5, 0.3);
    sensor1.castShadow = true;
    carGroup.add(sensor1);

    const sensor2 = new THREE.Mesh(sensorGeometry, detailMaterial);
    sensor2.position.set(0.3, 3.5, 0.3);
    sensor2.castShadow = true;
    carGroup.add(sensor2);

    // Front detail panels
    const frontPanelGeometry = new THREE.BoxGeometry(2, 0.6, 0.1);
    const frontPanel = new THREE.Mesh(frontPanelGeometry, detailMaterial);
    frontPanel.position.set(0, 1.5, 2.3);
    frontPanel.castShadow = true;
    carGroup.add(frontPanel);

    carGroup.position.y = 0;
    scene.add(carGroup);

    // Camera position
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, 0);

    // HTTP command control - states: 'stopped', 'walking', 'shooting'
    let robotState = "stopped";
    const carSpeed = 0.1;
    let walkCycle = 0;
    let shootCycle = 0;

    // Function to handle state changes
    const setRobotState = (newState) => {
      if (newState === robotState) return; // No change needed

      if (newState === "walking") {
        robotState = "walking";
        walkCycle = 0; // Reset walk cycle
      } else if (newState === "stopped") {
        robotState = "stopped";
        body.position.y = 1.2;
        muzzleFlashMaterial.opacity = 0;
      } else if (newState === "shooting") {
        robotState = "shooting";
        shootCycle = 0; // Reset shoot cycle
        body.position.y = 1.2;
      }
    };

    // Listen to Server-Sent Events (SSE) from the command endpoint
    const eventSource = new EventSource("http://0.0.0.0:8000/give-command");

    eventSource.onmessage = (event) => {
      try {
        console.log("Received data:", event.data);

        // The Python server sends the dict as a string, need to parse it
        // It sends: {"command": "MOVE"} with single quotes as {'command': 'MOVE'}
        let data;
        try {
          // First try parsing as JSON
          data = JSON.parse(event.data);
        } catch (e) {
          // If that fails, try replacing single quotes with double quotes
          const jsonString = event.data.replace(/'/g, '"');
          data = JSON.parse(jsonString);
        }

        if (data && data.command) {
          const command = data.command.toUpperCase();
          console.log("Command:", command);
          if (command === "MOVE") {
            setRobotState("walking");
          } else if (command === "STOP") {
            setRobotState("stopped");
          } else if (command === "SHOOT") {
            setRobotState("shooting");
          }
        }
      } catch (error) {
        console.error("Error parsing command:", error, "Raw data:", event.data);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
    };

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Walking animation - tracked vehicle
      if (robotState === "walking") {
        walkCycle += 0.1;

        // Slight vehicle bob for movement effect
        body.position.y = 1.2 + Math.sin(walkCycle * 2) * 0.05;

        // Move forward
        carGroup.position.z -= carSpeed;

        // Hide muzzle flash when walking
        muzzleFlashMaterial.opacity = 0;
      }

      // Shooting animation
      if (robotState === "shooting") {
        shootCycle += 0.2;

        // Gun recoil effect
        const recoil = Math.abs(Math.sin(shootCycle * 3)) * 0.2;
        barrel.position.z = -1.8 + recoil;
        barrelTip.position.z = -3.2 + recoil;

        // Muzzle flash effect
        const flashIntensity = Math.random();
        if (flashIntensity > 0.5) {
          muzzleFlashMaterial.opacity = 0.8 + Math.random() * 0.2;
          // Vary muzzle flash size
          muzzleFlash.scale.set(
            1 + Math.random() * 0.5,
            1 + Math.random() * 0.5,
            1 + Math.random() * 0.5
          );
        } else {
          muzzleFlashMaterial.opacity = 0;
        }
      }

      // Reset animations when stopped
      if (robotState === "stopped") {
        muzzleFlashMaterial.opacity = 0;
        barrel.position.z = -1.8;
        barrelTip.position.z = -3.2;
      }

      // Infinite terrain generation
      // Check if we need to generate new planes ahead
      const frontmostPlane = planes[0];
      const vehicleZ = carGroup.position.z;

      // If vehicle is getting close to the front plane, generate a new one ahead
      if (vehicleZ < frontmostPlane.zPosition + planeSize) {
        const newZPosition = frontmostPlane.zPosition - planeSize;
        const newPlaneData = createPlane(newZPosition);
        planes.unshift(newPlaneData);
      }

      // Remove planes that are far behind the vehicle
      if (planes.length > 5) {
        const backPlane = planes[planes.length - 1];
        if (vehicleZ < backPlane.zPosition - planeSize * 2) {
          scene.remove(backPlane.plane);
          scene.remove(backPlane.grid);
          backPlane.plane.geometry.dispose();
          backPlane.plane.material.dispose();
          planes.pop();
        }
      }

      // Update camera to follow car
      camera.position.x = carGroup.position.x;
      camera.position.z = carGroup.position.z + 12;
      camera.lookAt(carGroup.position);

      // Update directional light to follow vehicle for consistent shadows
      directionalLight.position.x = carGroup.position.x + 10;
      directionalLight.position.z = carGroup.position.z + 10;
      directionalLight.target.position.copy(carGroup.position);
      directionalLight.target.updateMatrixWorld();

      renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      eventSource.close();
      window.removeEventListener("resize", handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-black/50 text-white p-4 rounded">
        <h1 className="text-xl font-bold mb-2">Palm Pilots Demo</h1>

        <p className="text-sm">Commands:</p>
        <ul className="text-xs ml-4 list-disc">
          <li>
            <strong>MOVE</strong> - Open Palm
          </li>
          <li>
            <strong>STOP</strong> - Closed Fist
          </li>
          <li>
            <strong>SHOOT</strong> - Pointed Gun
          </li>
        </ul>
      </div>
    </div>
  );
}
