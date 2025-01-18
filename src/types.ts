export interface AuthCredentials {
    username: string;
    password: string;
  }
  
  export type GoogleSheetRow = string[];
  
  export interface AuthContextType {
    isAuthenticated: boolean;
    login: (credentials: AuthCredentials) => Promise<boolean>;
    logout: () => void;
  }

  