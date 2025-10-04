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
    scene.add(directionalLight);

    // Infinite terrain system
    const planeSize = 50;
    const planes = [];
    const grids = [];

    function createPlane(zPosition) {
      // Create ground plane
      const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.9,
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

    // Create military robot
    const carGroup = new THREE.Group();

    // Robot materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a4a2a,
      roughness: 0.6,
      metalness: 0.6,
    });

    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.4,
      metalness: 0.8,
    });

    // Main body (central chassis)
    const bodyGeometry = new THREE.BoxGeometry(2.5, 1.2, 3);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2.5;
    body.castShadow = true;
    carGroup.add(body);

    // Create four legs with animation support
    const legs = {};
    const legPositions = [
      { x: -1.2, z: 1.2, name: "frontLeft" },
      { x: 1.2, z: 1.2, name: "frontRight" },
      { x: -1.2, z: -1.2, name: "backLeft" },
      { x: 1.2, z: -1.2, name: "backRight" },
    ];

    legPositions.forEach((legPos) => {
      // Create a group for each leg for easier animation
      const legGroup = new THREE.Group();
      legGroup.position.set(legPos.x, 2.5, legPos.z);

      // Upper leg joint (hip)
      const hipGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const hip = new THREE.Mesh(hipGeometry, jointMaterial);
      hip.position.set(0, 0, 0);
      hip.castShadow = true;
      legGroup.add(hip);

      // Upper leg segment
      const upperLegGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 12);
      const upperLeg = new THREE.Mesh(upperLegGeometry, bodyMaterial);
      upperLeg.position.set(0, -0.6, 0);
      upperLeg.castShadow = true;
      legGroup.add(upperLeg);

      // Knee joint
      const kneeGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const knee = new THREE.Mesh(kneeGeometry, jointMaterial);
      knee.position.set(0, -1.2, 0);
      knee.castShadow = true;
      legGroup.add(knee);

      // Lower leg segment
      const lowerLegGeometry = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 12);
      const lowerLeg = new THREE.Mesh(lowerLegGeometry, bodyMaterial);
      lowerLeg.position.set(0, -1.8, 0);
      lowerLeg.castShadow = true;
      legGroup.add(lowerLeg);

      // Foot
      const footGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.5);
      const foot = new THREE.Mesh(footGeometry, jointMaterial);
      foot.position.set(0, -2.42, 0);
      foot.castShadow = true;
      legGroup.add(foot);

      carGroup.add(legGroup);
      legs[legPos.name] = legGroup;
    });

    // Gun turret base
    const turretBaseGeometry = new THREE.CylinderGeometry(0.8, 0.9, 0.5, 16);
    const turretBase = new THREE.Mesh(turretBaseGeometry, bodyMaterial);
    turretBase.position.y = 3.35;
    turretBase.castShadow = true;
    carGroup.add(turretBase);

    // Gun turret head
    const turretHeadGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    const turretHead = new THREE.Mesh(turretHeadGeometry, bodyMaterial);
    turretHead.position.y = 3.9;
    turretHead.castShadow = true;
    carGroup.add(turretHead);

    // Gun barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 12);
    const barrel = new THREE.Mesh(barrelGeometry, jointMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.rotation.y = Math.PI;
    barrel.position.set(0, 3.9, -1.6);
    barrel.castShadow = true;
    carGroup.add(barrel);

    // Gun barrel tip
    const barrelTipGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.3, 12);
    const barrelTip = new THREE.Mesh(barrelTipGeometry, jointMaterial);
    barrelTip.rotation.x = Math.PI / 2;
    barrelTip.rotation.y = Math.PI;
    barrelTip.position.set(0, 3.9, -2.75);
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
    muzzleFlash.position.set(0, 3.9, -3.2);
    carGroup.add(muzzleFlash);

    // Sensor/camera on turret
    const sensorGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.2);
    const sensor = new THREE.Mesh(sensorGeometry, jointMaterial);
    sensor.position.set(0.4, 4.2, 0.6);
    sensor.castShadow = true;
    carGroup.add(sensor);

    // Antenna
    const antennaGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    const antenna = new THREE.Mesh(antennaGeometry, jointMaterial);
    antenna.position.set(-0.8, 3.5, -1);
    antenna.castShadow = true;
    carGroup.add(antenna);

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
        // Reset leg positions when stopping
        legs.frontLeft.rotation.x = 0;
        legs.frontRight.rotation.x = 0;
        legs.backLeft.rotation.x = 0;
        legs.backRight.rotation.x = 0;
        body.position.y = 2.5;
        muzzleFlashMaterial.opacity = 0;
      } else if (newState === "shooting") {
        robotState = "shooting";
        shootCycle = 0; // Reset shoot cycle
        // Reset leg positions when shooting
        legs.frontLeft.rotation.x = 0;
        legs.frontRight.rotation.x = 0;
        legs.backLeft.rotation.x = 0;
        legs.backRight.rotation.x = 0;
        body.position.y = 2.5;
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

      // Walking animation
      if (robotState === "walking") {
        walkCycle += 0.1;

        // Front left and back right move together (diagonal pair)
        const swing1 = Math.sin(walkCycle) * 0.3;
        legs.frontLeft.rotation.x = swing1;
        legs.backRight.rotation.x = swing1;

        // Front right and back left move together (diagonal pair)
        const swing2 = Math.sin(walkCycle + Math.PI) * 0.3;
        legs.frontRight.rotation.x = swing2;
        legs.backLeft.rotation.x = swing2;

        // Add slight body bob for realism
        body.position.y = 2.5 + Math.abs(Math.sin(walkCycle * 2)) * 0.1;

        // Move forward
        carGroup.position.z -= carSpeed;

        // Hide muzzle flash when walking
        muzzleFlashMaterial.opacity = 0;
      }

      // Shooting animation
      if (robotState === "shooting") {
        shootCycle += 0.2;

        // Gun recoil effect
        const recoil = Math.abs(Math.sin(shootCycle * 3)) * 0.15;
        barrel.position.z = -1.6 + recoil;
        barrelTip.position.z = -2.75 + recoil;

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
        barrel.position.z = -1.6;
        barrelTip.position.z = -2.75;
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
