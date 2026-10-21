export type UserRole = 'DIRECTION' | 'ENSEIGNANT' | 'PARENT' | 'SURVEILLANT';

/**
 * Définition des permissions par rôle
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  DIRECTION: [
    'view:dashboard',
    'view:all_classes',
    'view:all_students',
    'view:all_teachers',
    'view:all_parents',
    'manage:students',
    'manage:classes',
    'manage:teachers',
    'manage:parents',
    'manage:calendar',
    'manage:rules',
    'manage:settings',
    'scan:qr',
    'view:reports',
    'export:excel',
    'import:excel',
    'view:audit',
    'manage:justificatifs',
  ],
  ENSEIGNANT: [
    'view:dashboard',
    'view:my_classes',
    'view:my_students',
    'mark:attendance',
    'mark:attendance_manual',
    'view:reports',
    'manage:justificatifs',
  ],
  PARENT: [
    'view:dashboard',
    'view:my_children',
    'view:my_children_attendance',
    'submit:justificatif',
  ],
  SURVEILLANT: [
    'scan:qr',
    'mark:attendance',
  ],
};

/**
 * Vérifie si un rôle a une permission spécifique
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Vérifie si un rôle a au moins une des permissions requises
 */
export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Vérifie si un rôle a toutes les permissions requises
 */
export function hasAllPermissions(role: UserRole, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Détermine si un utilisateur peut voir les données d'une classe spécifique
 */
export function canViewClassData(role: UserRole, userClassIds: string[], classId: string): boolean {
  if (role === 'DIRECTION') return true;
  if (role === 'ENSEIGNANT' || role === 'SURVEILLANT') {
    return userClassIds.includes(classId);
  }
  return false;
}

/**
 * Détermine si un utilisateur peut voir les données d'un élève spécifique
 */
export function canViewStudentData(
  role: UserRole,
  userClassIds: string[],
  userChildrenIds: string[],
  studentClassId: string,
  studentId: string
): boolean {
  if (role === 'DIRECTION') return true;
  if (role === 'ENSEIGNANT' || role === 'SURVEILLANT') {
    return userClassIds.includes(studentClassId);
  }
  if (role === 'PARENT') {
    return userChildrenIds.includes(studentId);
  }
  return false;
}

/**
 * Détermine si un utilisateur peut modifier un enregistrement
 */
export function canModifyRecord(role: UserRole, permission: string): boolean {
  return hasPermission(role, permission);
}

/**
 * Génère une erreur d'accès refusé
 */
export class AccessDeniedError extends Error {
  constructor(message: string = 'Accès refusé') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

/**
 * Vérifie la permission et lance une erreur si non autorisé
 */
export function requirePermission(role: UserRole, permission: string): void {
  if (!hasPermission(role, permission)) {
    throw new AccessDeniedError(`Permission requise: ${permission}`);
  }
}

/**
 * Vérifie une des permissions requises et lance une erreur si non autorisé
 */
export function requireAnyPermission(role: UserRole, permissions: string[]): void {
  if (!hasAnyPermission(role, permissions)) {
    throw new AccessDeniedError(`Une des permissions requises: ${permissions.join(' ou ')}`);
  }
}
