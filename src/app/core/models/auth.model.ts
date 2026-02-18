export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  username: string;
  authorities: string;
}

export interface AuthUser {
  username: string;
  roles: string[];
  permissions: string[];
  token: string;
}
