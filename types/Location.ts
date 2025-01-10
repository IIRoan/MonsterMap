export interface Location {
    id: string;
    name: string;
    address: string;
    coordinates: [number, number];
    variants: string[];
  }
  
  export interface LocationResponse {
    location_id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    variants: string[];
  }