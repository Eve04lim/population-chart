export interface Prefecture {
    prefCode: number;
    prefName: string;
  }
  
  export interface PopulationData {
    label: string;
    data: {
      year: number;
      value: number;
    }[];
  }
  
  export interface PopulationComposition {
    boundaryYear: number;
    data: PopulationData[];
  }
  
  export interface PopulationResponse {
    message: null;
    result: {
      boundaryYear: number;
      data: PopulationData[];
    };
  }
  
  export interface PrefecturesResponse {
    message: null;
    result: Prefecture[];
  }