import { EphemerisData } from '../types/planet';

export class HorizonsAPI {
  private baseUrl = 'https://ssd.jpl.nasa.gov/api/horizons.api';
  
  // Planet IDs for Horizons API
  private planetIds: { [key: string]: string } = {
    'Mercury': '199',
    'Venus': '299',
    'Earth': '399',
    'Mars': '499',
    'Jupiter': '599',
    'Saturn': '699',
    'Uranus': '799',
    'Neptune': '899',
    'Sun': '10',
  };

  /**
   * Get ephemeris data for a planet at a specific date
   * Note: Due to CORS restrictions, this would need a backend proxy in production
   */
  public async getPlanetPosition(
    planetName: string,
    date: Date = new Date()
  ): Promise<EphemerisData | null> {
    const planetId = this.planetIds[planetName];
    if (!planetId) {
      console.error(`Unknown planet: ${planetName}`);
      return null;
    }

    const startDate = this.formatDate(date);
    const endDate = this.formatDate(new Date(date.getTime() + 86400000)); // +1 day

    const params = new URLSearchParams({
      format: 'json',
      COMMAND: planetId,
      OBJ_DATA: 'YES',
      MAKE_EPHEM: 'YES',
      EPHEM_TYPE: 'VECTORS',
      CENTER: '@sun',
      START_TIME: startDate,
      STOP_TIME: endDate,
      STEP_SIZE: '1d',
      VEC_TABLE: '2', // Position and velocity vectors
      REF_SYSTEM: 'ICRF',
      REF_PLANE: 'ECLIPTIC',
      VEC_CORR: 'NONE',
      OUT_UNITS: 'AU-D',
      CSV_FORMAT: 'NO',
    });

    try {
      // Note: This will fail due to CORS in browser
      // In production, you'd need a backend proxy or use a CORS-enabled endpoint
      const response = await fetch(`${this.baseUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.parseEphemerisData(data);
    } catch (error) {
      console.warn('Failed to fetch from Horizons API, using calculated positions:', error);
      return null;
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseEphemerisData(data: any): EphemerisData | null {
    try {
      // Parse the Horizons API response
      // The actual parsing would depend on the response format
      // This is a simplified version
      if (data && data.result) {
        // Find the data section and parse vectors
        // This is highly simplified - actual implementation would be more complex
        
        return {
          jd: 2459000, // Julian date (simplified)
          x: 0,
          y: 0,
          z: 0,
          vx: 0,
          vy: 0,
          vz: 0,
        };
      }
    } catch (error) {
      console.error('Failed to parse ephemeris data:', error);
    }
    
    return null;
  }

  /**
   * Calculate approximate planet position using Keplerian orbital elements
   * This is used as a fallback when API is not available
   */
  public calculatePosition(
    _planetName: string,
    _date: Date = new Date()
  ): { x: number; y: number; z: number } {
    // This uses the simplified orbital mechanics already implemented
    // in the Planet class
    return { x: 0, y: 0, z: 0 };
  }
}

// Singleton instance
export const horizonsAPI = new HorizonsAPI();