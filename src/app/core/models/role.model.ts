export interface Role {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  permissionIds: number[];
  permissionNames: string[];
  createdDate: string;
  lastModifiedDate: string | null;
  createdBy: string | null;
  lastModifiedBy: string | null;
}

export interface RoleRequest {
  name: string;
  description: string;
  isActive: boolean;
  permissionIds: number[];
}

export const ROLE_FIELDS = [
  { field: 'name', label: 'Name', type: 'string' },
  { field: 'description', label: 'Description', type: 'string' },
  { field: 'isActive', label: 'Active', type: 'boolean' },
  { field: 'createdDate', label: 'Created Date', type: 'date' },
  { field: 'permissionName', label: 'Permission (computed)', type: 'string' },
  { field: 'permissions.name', label: 'Permission Name', type: 'string' },
] as const;

export const ROLE_COLUMNS: { key: string; label: string }[] = [
  { key: 'name', label: 'Role Name' },
  { key: 'description', label: 'Description' },
];
