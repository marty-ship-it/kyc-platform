/**
 * Role-Based Access Control (RBAC) utilities
 * Defines permissions for different user roles in the KYC platform
 */

export type UserRole = 'DIRECTOR' | 'COMPLIANCE' | 'AGENT'

export interface Permission {
  action: string
  resource: string
  description: string
}

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
  inheritsFrom?: UserRole[]
}

// Define all available permissions
export const PERMISSIONS = {
  // Entity permissions
  ENTITY_CREATE: { action: 'create', resource: 'entity', description: 'Create new entities' },
  ENTITY_READ: { action: 'read', resource: 'entity', description: 'View entity details' },
  ENTITY_UPDATE: { action: 'update', resource: 'entity', description: 'Edit entity information' },
  ENTITY_DELETE: { action: 'delete', resource: 'entity', description: 'Delete entities' },
  ENTITY_SCREEN: { action: 'screen', resource: 'entity', description: 'Run entity screening' },

  // Case permissions
  CASE_CREATE: { action: 'create', resource: 'case', description: 'Create compliance cases' },
  CASE_READ: { action: 'read', resource: 'case', description: 'View case details' },
  CASE_UPDATE: { action: 'update', resource: 'case', description: 'Edit case information' },
  CASE_ASSIGN: { action: 'assign', resource: 'case', description: 'Assign cases to users' },
  CASE_CLOSE: { action: 'close', resource: 'case', description: 'Close compliance cases' },
  CASE_DELETE: { action: 'delete', resource: 'case', description: 'Delete cases' },

  // Deal permissions
  DEAL_CREATE: { action: 'create', resource: 'deal', description: 'Create new deals' },
  DEAL_READ: { action: 'read', resource: 'deal', description: 'View deal details' },
  DEAL_UPDATE: { action: 'update', resource: 'deal', description: 'Edit deal information' },
  DEAL_DELETE: { action: 'delete', resource: 'deal', description: 'Delete deals' },

  // Report permissions
  REPORT_CREATE: { action: 'create', resource: 'report', description: 'Generate reports' },
  REPORT_READ: { action: 'read', resource: 'report', description: 'View reports' },
  REPORT_SUBMIT: { action: 'submit', resource: 'report', description: 'Submit reports to authorities' },
  REPORT_DELETE: { action: 'delete', resource: 'report', description: 'Delete reports' },

  // Admin permissions
  ADMIN_SETTINGS: { action: 'manage', resource: 'admin', description: 'Access admin settings' },
  ADMIN_USERS: { action: 'manage', resource: 'users', description: 'Manage user accounts' },
  ADMIN_AUTOMATION: { action: 'manage', resource: 'automation', description: 'Configure automation settings' },

  // Audit permissions
  AUDIT_READ: { action: 'read', resource: 'audit', description: 'View audit trails' },
  AUDIT_EXPORT: { action: 'export', resource: 'audit', description: 'Export audit data' },

  // Training permissions
  TRAINING_READ: { action: 'read', resource: 'training', description: 'Access training materials' },
  TRAINING_ASSIGN: { action: 'assign', resource: 'training', description: 'Assign training to users' },
} as const

// Role definitions with permissions
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  AGENT: {
    role: 'AGENT',
    permissions: [
      PERMISSIONS.ENTITY_READ,
      PERMISSIONS.ENTITY_SCREEN,
      PERMISSIONS.CASE_READ,
      PERMISSIONS.CASE_UPDATE, // Can add notes but can't change status
      PERMISSIONS.DEAL_READ,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.AUDIT_READ,
      PERMISSIONS.TRAINING_READ,
    ]
  },

  COMPLIANCE: {
    role: 'COMPLIANCE',
    permissions: [
      PERMISSIONS.ENTITY_CREATE,
      PERMISSIONS.ENTITY_READ,
      PERMISSIONS.ENTITY_UPDATE,
      PERMISSIONS.ENTITY_SCREEN,
      PERMISSIONS.CASE_CREATE,
      PERMISSIONS.CASE_READ,
      PERMISSIONS.CASE_UPDATE,
      PERMISSIONS.CASE_ASSIGN,
      PERMISSIONS.CASE_CLOSE,
      PERMISSIONS.DEAL_READ,
      PERMISSIONS.DEAL_UPDATE,
      PERMISSIONS.REPORT_CREATE,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.REPORT_SUBMIT,
      PERMISSIONS.AUDIT_READ,
      PERMISSIONS.AUDIT_EXPORT,
      PERMISSIONS.TRAINING_READ,
      PERMISSIONS.TRAINING_ASSIGN,
      PERMISSIONS.ADMIN_AUTOMATION, // Can configure screening automation
    ]
  },

  DIRECTOR: {
    role: 'DIRECTOR',
    permissions: [
      // Directors have all permissions
      ...Object.values(PERMISSIONS)
    ]
  }
}

/**
 * RBAC Service for checking user permissions
 */
export class RBACService {
  /**
   * Check if a user has a specific permission
   */
  static hasPermission(userRole: UserRole, action: string, resource: string): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole]
    if (!rolePermissions) return false

    return rolePermissions.permissions.some(
      permission => permission.action === action && permission.resource === resource
    )
  }

  /**
   * Check if user can perform action on resource
   */
  static canPerform(userRole: UserRole, permission: Permission): boolean {
    return this.hasPermission(userRole, permission.action, permission.resource)
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(userRole: UserRole): Permission[] {
    const rolePermissions = ROLE_PERMISSIONS[userRole]
    return rolePermissions ? rolePermissions.permissions : []
  }

  /**
   * Check if user has admin access
   */
  static hasAdminAccess(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'manage', 'admin')
  }

  /**
   * Check if user can manage cases
   */
  static canManageCases(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'create', 'case') ||
           this.hasPermission(userRole, 'assign', 'case') ||
           this.hasPermission(userRole, 'close', 'case')
  }

  /**
   * Check if user can submit reports
   */
  static canSubmitReports(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'submit', 'report')
  }

  /**
   * Check if user can configure automation
   */
  static canConfigureAutomation(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'manage', 'automation')
  }

  /**
   * Get accessible resources for a role
   */
  static getAccessibleResources(userRole: UserRole): string[] {
    const permissions = this.getRolePermissions(userRole)
    const resources = new Set(permissions.map(p => p.resource))
    return Array.from(resources)
  }

  /**
   * Get role hierarchy (for UI role display)
   */
  static getRoleHierarchy(): UserRole[] {
    return ['DIRECTOR', 'COMPLIANCE', 'AGENT']
  }

  /**
   * Get role description
   */
  static getRoleDescription(role: UserRole): string {
    switch (role) {
      case 'DIRECTOR':
        return 'Full system access with all administrative privileges'
      case 'COMPLIANCE':
        return 'Case management, reporting, and compliance oversight'
      case 'AGENT':
        return 'Entity screening and basic case viewing'
      default:
        return 'Unknown role'
    }
  }

  /**
   * Validate user role
   */
  static isValidRole(role: string): role is UserRole {
    return ['DIRECTOR', 'COMPLIANCE', 'AGENT'].includes(role as UserRole)
  }
}

/**
 * Higher-order component for route protection
 */
export function requiresPermission(permission: Permission) {
  return function (userRole: UserRole): boolean {
    return RBACService.canPerform(userRole, permission)
  }
}

/**
 * Route access control definitions
 */
export const ROUTE_ACCESS: Record<string, Permission[]> = {
  '/admin': [PERMISSIONS.ADMIN_SETTINGS],
  '/cases': [PERMISSIONS.CASE_READ],
  '/cases/create': [PERMISSIONS.CASE_CREATE],
  '/entities': [PERMISSIONS.ENTITY_READ],
  '/entities/create': [PERMISSIONS.ENTITY_CREATE],
  '/deals': [PERMISSIONS.DEAL_READ],
  '/deals/create': [PERMISSIONS.DEAL_CREATE],
  '/reports': [PERMISSIONS.REPORT_READ],
  '/reports/create': [PERMISSIONS.REPORT_CREATE],
  '/training': [PERMISSIONS.TRAINING_READ],
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(route: string, userRole: UserRole): boolean {
  const requiredPermissions = ROUTE_ACCESS[route]
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true // No specific permissions required
  }

  return requiredPermissions.some(permission => 
    RBACService.canPerform(userRole, permission)
  )
}