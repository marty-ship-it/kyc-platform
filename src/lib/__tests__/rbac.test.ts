import { RBACService, PERMISSIONS, UserRole } from '../rbac'

describe('RBACService', () => {
  describe('hasPermission', () => {
    it('should allow DIRECTOR to access all permissions', () => {
      expect(RBACService.hasPermission('DIRECTOR', 'create', 'entity')).toBe(true)
      expect(RBACService.hasPermission('DIRECTOR', 'manage', 'admin')).toBe(true)
      expect(RBACService.hasPermission('DIRECTOR', 'delete', 'case')).toBe(true)
    })

    it('should allow COMPLIANCE to manage cases and reports', () => {
      expect(RBACService.hasPermission('COMPLIANCE', 'create', 'case')).toBe(true)
      expect(RBACService.hasPermission('COMPLIANCE', 'create', 'report')).toBe(true)
      expect(RBACService.hasPermission('COMPLIANCE', 'assign', 'case')).toBe(true)
      expect(RBACService.hasPermission('COMPLIANCE', 'close', 'case')).toBe(true)
    })

    it('should not allow COMPLIANCE to access admin settings', () => {
      expect(RBACService.hasPermission('COMPLIANCE', 'manage', 'admin')).toBe(false)
      expect(RBACService.hasPermission('COMPLIANCE', 'manage', 'users')).toBe(false)
    })

    it('should allow AGENT to read entities and cases', () => {
      expect(RBACService.hasPermission('AGENT', 'read', 'entity')).toBe(true)
      expect(RBACService.hasPermission('AGENT', 'read', 'case')).toBe(true)
      expect(RBACService.hasPermission('AGENT', 'screen', 'entity')).toBe(true)
    })

    it('should not allow AGENT to create or delete entities', () => {
      expect(RBACService.hasPermission('AGENT', 'create', 'entity')).toBe(false)
      expect(RBACService.hasPermission('AGENT', 'delete', 'entity')).toBe(false)
      expect(RBACService.hasPermission('AGENT', 'create', 'case')).toBe(false)
    })
  })

  describe('canPerform', () => {
    it('should work with permission objects', () => {
      expect(RBACService.canPerform('DIRECTOR', PERMISSIONS.ADMIN_SETTINGS)).toBe(true)
      expect(RBACService.canPerform('COMPLIANCE', PERMISSIONS.CASE_CREATE)).toBe(true)
      expect(RBACService.canPerform('AGENT', PERMISSIONS.ENTITY_READ)).toBe(true)
      expect(RBACService.canPerform('AGENT', PERMISSIONS.ADMIN_SETTINGS)).toBe(false)
    })
  })

  describe('hasAdminAccess', () => {
    it('should only allow DIRECTOR to have admin access', () => {
      expect(RBACService.hasAdminAccess('DIRECTOR')).toBe(true)
      expect(RBACService.hasAdminAccess('COMPLIANCE')).toBe(false)
      expect(RBACService.hasAdminAccess('AGENT')).toBe(false)
    })
  })

  describe('canManageCases', () => {
    it('should allow DIRECTOR and COMPLIANCE to manage cases', () => {
      expect(RBACService.canManageCases('DIRECTOR')).toBe(true)
      expect(RBACService.canManageCases('COMPLIANCE')).toBe(true)
      expect(RBACService.canManageCases('AGENT')).toBe(false)
    })
  })

  describe('canSubmitReports', () => {
    it('should allow DIRECTOR and COMPLIANCE to submit reports', () => {
      expect(RBACService.canSubmitReports('DIRECTOR')).toBe(true)
      expect(RBACService.canSubmitReports('COMPLIANCE')).toBe(true)
      expect(RBACService.canSubmitReports('AGENT')).toBe(false)
    })
  })

  describe('canConfigureAutomation', () => {
    it('should allow DIRECTOR and COMPLIANCE to configure automation', () => {
      expect(RBACService.canConfigureAutomation('DIRECTOR')).toBe(true)
      expect(RBACService.canConfigureAutomation('COMPLIANCE')).toBe(true)
      expect(RBACService.canConfigureAutomation('AGENT')).toBe(false)
    })
  })

  describe('isValidRole', () => {
    it('should validate role strings', () => {
      expect(RBACService.isValidRole('DIRECTOR')).toBe(true)
      expect(RBACService.isValidRole('COMPLIANCE')).toBe(true)
      expect(RBACService.isValidRole('AGENT')).toBe(true)
      expect(RBACService.isValidRole('INVALID')).toBe(false)
      expect(RBACService.isValidRole('admin')).toBe(false)
    })
  })

  describe('getRoleDescription', () => {
    it('should return appropriate role descriptions', () => {
      expect(RBACService.getRoleDescription('DIRECTOR')).toContain('Full system access')
      expect(RBACService.getRoleDescription('COMPLIANCE')).toContain('Case management')
      expect(RBACService.getRoleDescription('AGENT')).toContain('Entity screening')
    })
  })

  describe('getAccessibleResources', () => {
    it('should return correct resources for each role', () => {
      const directorResources = RBACService.getAccessibleResources('DIRECTOR')
      const complianceResources = RBACService.getAccessibleResources('COMPLIANCE')
      const agentResources = RBACService.getAccessibleResources('AGENT')

      expect(directorResources).toContain('admin')
      expect(directorResources).toContain('entity')
      expect(directorResources).toContain('case')

      expect(complianceResources).toContain('entity')
      expect(complianceResources).toContain('case')
      expect(complianceResources).toContain('automation')
      expect(complianceResources).not.toContain('users')

      expect(agentResources).toContain('entity')
      expect(agentResources).toContain('case')
      expect(agentResources).not.toContain('admin')
    })
  })
})