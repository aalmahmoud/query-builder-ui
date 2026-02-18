export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  nationalId: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdDate: string;
  lastModifiedDate: string | null;
  createdBy: string | null;
  lastModifiedBy: string | null;
}

export interface UserRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  nationalId: string;
  password?: string;
  roleId: number;
  isActive: boolean;
}

export const USER_FIELDS = [
  { field: 'firstName', label: 'First Name', type: 'string' },
  { field: 'lastName', label: 'Last Name', type: 'string' },
  { field: 'email', label: 'Email', type: 'string' },
  { field: 'mobileNumber', label: 'Mobile', type: 'string' },
  { field: 'nationalId', label: 'National ID', type: 'string' },
  { field: 'isActive', label: 'Active', type: 'boolean' },
  { field: 'createdDate', label: 'Created Date', type: 'date' },
  { field: 'fullName', label: 'Full Name (computed)', type: 'string' },
  { field: 'roleName', label: 'Role Name (computed)', type: 'string' },
  { field: 'permissionName', label: 'Permission (computed)', type: 'string' },
  { field: 'role.name', label: 'Role Name', type: 'string' },
  { field: 'role.id', label: 'Role ID', type: 'number' },
] as const;

export const USER_COLUMNS: { key: string; label: string }[] = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'mobileNumber', label: 'Mobile' },
  { key: 'nationalId', label: 'National ID' },
];
