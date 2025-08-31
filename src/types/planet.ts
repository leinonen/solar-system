import { Vector3, Color } from 'three';

export interface PlanetData {
  name: string;
  radius: number; // km
  mass: number; // kg
  orbitalRadius: number; // AU
  orbitalPeriod: number; // Earth days
  rotationPeriod: number; // hours
  inclination: number; // degrees
  eccentricity: number;
  axialTilt: number; // degrees
  color: Color;
  temperature?: {
    min: number;
    max: number;
  };
  moons?: MoonData[];
  rings?: RingData[];
  texture?: string;
}

export interface MoonData {
  name: string;
  radius: number;
  orbitalRadius: number;
  orbitalPeriod: number;
}

export interface RingData {
  innerRadius: number;
  outerRadius: number;
  texture?: string;
}

export interface CelestialBody {
  position: Vector3;
  velocity: Vector3;
  rotation: number;
}

export interface EphemerisData {
  jd: number; // Julian date
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}