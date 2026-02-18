export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
  isActive: boolean;
  createdDate: string;
  lastModifiedDate: string | null;
  createdBy: string | null;
  lastModifiedBy: string | null;
}

export interface PermissionRequest {
  name: string;
  resource: string;
  action: string;
  description: string;
  isActive: boolean;
}

export const PERMISSION_FIELDS = [
  { field: 'name', label: 'Name', type: 'string' },
  { field: 'resource', label: 'Resource', type: 'string' },
  { field: 'action', label: 'Action', type: 'string' },
  { field: 'description', label: 'Description', type: 'string' },
  { field: 'isActive', label: 'Active', type: 'boolean' },
  { field: 'createdDate', label: 'Created Date', type: 'date' },
] as const;

export const PERMISSION_COLUMNS: { key: string; label: string }[] = [
  { key: 'name', label: 'Permission Name' },
  { key: 'resource', label: 'Resource' },
  { key: 'action', label: 'Action' },
  { key: 'description', label: 'Description' },
];
