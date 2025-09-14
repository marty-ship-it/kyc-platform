'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import { RBACService, Permission, UserRole } from '@/lib/rbac'

interface RoleGuardProps {
  children: ReactNode
  permission?: Permission
  requiredRole?: UserRole | UserRole[]
  fallback?: ReactNode
  requireAll?: boolean // If true, user must have ALL permissions/roles
}

/**
 * Component that conditionally renders children based on user permissions
 */
export function RoleGuard({ 
  children, 
  permission, 
  requiredRole, 
  fallback = null,
  requireAll = false 
}: RoleGuardProps) {
  const { data: session } = useSession()

  if (!session?.user?.role) {
    return <>{fallback}</>
  }

  const userRole = session.user.role as UserRole
  let hasAccess = false

  // Check permission-based access
  if (permission) {
    hasAccess = RBACService.canPerform(userRole, permission)
  }

  // Check role-based access
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    
    if (requireAll) {
      hasAccess = roles.every(role => userRole === role)
    } else {
      hasAccess = roles.includes(userRole)
    }
  }

  // If both permission and role checks are specified
  if (permission && requiredRole) {
    const permissionCheck = RBACService.canPerform(userRole, permission)
    const roleCheck = Array.isArray(requiredRole) 
      ? requiredRole.includes(userRole)
      : userRole === requiredRole

    hasAccess = requireAll ? (permissionCheck && roleCheck) : (permissionCheck || roleCheck)
  }

  // Default to allowing access if no restrictions specified
  if (!permission && !requiredRole) {
    hasAccess = true
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

/**
 * Hook to check if user has specific permission
 */
export function usePermission(permission: Permission): boolean {
  const { data: session } = useSession()
  
  if (!session?.user?.role) {
    return false
  }

  return RBACService.canPerform(session.user.role as UserRole, permission)
}

/**
 * Hook to check if user has specific role
 */
export function useRole(): UserRole | null {
  const { data: session } = useSession()
  return (session?.user?.role as UserRole) || null
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasRole(roles: UserRole | UserRole[]): boolean {
  const { data: session } = useSession()
  
  if (!session?.user?.role) {
    return false
  }

  const userRole = session.user.role as UserRole
  const checkRoles = Array.isArray(roles) ? roles : [roles]
  
  return checkRoles.includes(userRole)
}

/**
 * Hook to get all permissions for current user
 */
export function useUserPermissions(): Permission[] {
  const { data: session } = useSession()
  
  if (!session?.user?.role) {
    return []
  }

  return RBACService.getRolePermissions(session.user.role as UserRole)
}

/**
 * Component for role-based navigation items
 */
interface RoleNavItemProps {
  permission?: Permission
  requiredRole?: UserRole | UserRole[]
  children: ReactNode
}

export function RoleNavItem({ permission, requiredRole, children }: RoleNavItemProps) {
  return (
    <RoleGuard permission={permission} requiredRole={requiredRole}>
      {children}
    </RoleGuard>
  )
}

/**
 * Component to display user role badge
 */
export function UserRoleBadge({ className }: { className?: string }) {
  const { data: session } = useSession()
  
  if (!session?.user?.role) {
    return null
  }

  const role = session.user.role as UserRole
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'DIRECTOR':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'COMPLIANCE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'AGENT':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(role)} ${className || ''}`}>
      {role}
    </span>
  )
}