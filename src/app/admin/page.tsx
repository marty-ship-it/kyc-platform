'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/layout/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Zap, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Activity,
  RefreshCw,
  Shield
} from 'lucide-react'
import { motion } from 'framer-motion'
import { KycReuseService } from '@/lib/services/kyc-reuse'

interface AutomationSettings {
  autoScreenOnEntityCreate: boolean
  autoScreenOnEntityUpdate: boolean
  batchScreenTime: string | null
}

export default function AdminPage() {
  const { data: session } = useSession()
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    autoScreenOnEntityCreate: true,
    autoScreenOnEntityUpdate: true,
    batchScreenTime: null
  })
  const [loading, setLoading] = useState(false)
  const [kycRefreshData, setKycRefreshData] = useState<any[]>([])
  const [kycLoading, setKycLoading] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchKycRefreshData()
  }, [])

  const fetchSettings = async () => {
    try {
      // Mock settings - in real implementation, would fetch from API
      setAutomationSettings({
        autoScreenOnEntityCreate: true,
        autoScreenOnEntityUpdate: true,
        batchScreenTime: null
      })
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const fetchKycRefreshData = async () => {
    setKycLoading(true)
    try {
      // Mock KYC refresh data - in real implementation, would call KycReuseService
      const mockData = [
        {
          entity: { id: '1', fullName: 'James Chen', riskScore: 'MEDIUM' },
          kycStatus: { daysAgo: 95, hasValidKyc: true, lastKycDate: new Date('2024-01-10') },
          priority: 'MEDIUM'
        },
        {
          entity: { id: '2', fullName: 'Oceanic Investments', riskScore: 'HIGH' },
          kycStatus: { daysAgo: 180, hasValidKyc: true, lastKycDate: new Date('2023-08-15') },
          priority: 'HIGH'
        }
      ]
      setKycRefreshData(mockData.slice(0, 5)) // Show top 5
    } catch (error) {
      console.error('Failed to fetch KYC refresh data:', error)
    } finally {
      setKycLoading(false)
    }
  }

  const updateSetting = async (key: keyof AutomationSettings, value: any) => {
    setLoading(true)
    try {
      // Mock update - in real implementation, would call API
      setAutomationSettings(prev => ({
        ...prev,
        [key]: value
      }))
      
      console.log(`Updated ${key} to ${value}`)
    } catch (error) {
      console.error('Failed to update setting:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerBatchScreening = async () => {
    setLoading(true)
    try {
      // Mock batch screening trigger
      console.log('🔄 Triggered batch screening')
      // In real implementation: await fetch('/api/admin/batch-screen', { method: 'POST' })
    } catch (error) {
      console.error('Failed to trigger batch screening:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return null
  }

  // Only allow DIRECTOR and COMPLIANCE roles
  if (session.user.role !== 'DIRECTOR' && session.user.role !== 'COMPLIANCE') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen relative">
          <Navbar />
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-brand-warning mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Access Restricted
                </h3>
                <p className="text-muted-foreground">
                  You don't have permission to access the admin panel.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative">
        <Navbar />
        
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="h-8 w-8 text-brand-accent" />
              <h1 className="text-4xl font-heading font-bold text-foreground">
                Admin Panel
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Configure system settings and automation workflows
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Automation Settings */}
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Zap className="h-5 w-5 text-brand-accent" />
                    <span>Automation Settings</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Configure automated workflows for entity screening and compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Auto Screen on Create */}
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1">
                        Auto-screen on Entity Creation
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Automatically run screening when new entities are created
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {automationSettings.autoScreenOnEntityCreate ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-slate-400" />
                      )}
                      <Button
                        variant={automationSettings.autoScreenOnEntityCreate ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('autoScreenOnEntityCreate', !automationSettings.autoScreenOnEntityCreate)}
                        disabled={loading}
                      >
                        {automationSettings.autoScreenOnEntityCreate ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </div>

                  {/* Auto Screen on Update */}
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1">
                        Auto-screen on Entity Updates
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Automatically re-screen when key entity attributes change
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {automationSettings.autoScreenOnEntityUpdate ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-slate-400" />
                      )}
                      <Button
                        variant={automationSettings.autoScreenOnEntityUpdate ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting('autoScreenOnEntityUpdate', !automationSettings.autoScreenOnEntityUpdate)}
                        disabled={loading}
                      >
                        {automationSettings.autoScreenOnEntityUpdate ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </div>

                  {/* Batch Screening */}
                  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-1">
                        Batch Screening
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manually trigger batch screening of all entities
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={triggerBatchScreening}
                        disabled={loading}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Run Batch Screen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* System Status */}
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Activity className="h-5 w-5 text-brand-accent" />
                    <span>System Status</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Monitor system health and service availability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-foreground">Screening Service</h3>
                        <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                      </div>
                      <p className="text-sm text-muted-foreground">Online</p>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-foreground">DVS Integration</h3>
                        <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                      </div>
                      <p className="text-sm text-muted-foreground">Online</p>
                    </div>

                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-foreground">Database</h3>
                        <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                      </div>
                      <p className="text-sm text-muted-foreground">Healthy</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* KYC Management */}
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Shield className="h-5 w-5 text-brand-accent" />
                    <span>KYC Management</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Monitor KYC refresh requirements and entity compliance status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* KYC Refresh Overview */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-foreground">Entities Requiring KYC Refresh</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchKycRefreshData}
                        disabled={kycLoading}
                      >
                        {kycLoading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh
                      </Button>
                    </div>
                    
                    {kycRefreshData.length > 0 ? (
                      <div className="space-y-3">
                        {kycRefreshData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-foreground">{item.entity.fullName}</span>
                                <Badge variant="outline" className={
                                  item.priority === 'HIGH' ? 'bg-red-100 text-red-800 border-red-200' :
                                  item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                  'bg-blue-100 text-blue-800 border-blue-200'
                                }>
                                  {item.priority}
                                </Badge>
                                <Badge variant="outline" className={
                                  item.entity.riskScore === 'HIGH' ? 'bg-red-100 text-red-800 border-red-200' :
                                  item.entity.riskScore === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                  'bg-green-100 text-green-800 border-green-200'
                                }>
                                  {item.entity.riskScore}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                KYC last completed {item.kycStatus.daysAgo} days ago
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Review
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        {kycLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Loading KYC data...</span>
                          </div>
                        ) : (
                          <div>
                            <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                            <p>All entities have current KYC verification</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* KYC Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div className="text-xl font-bold text-emerald-400 mb-1">
                        {kycRefreshData.filter(item => item.priority === 'LOW').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Low Priority</div>
                    </div>
                    
                    <div className="text-center p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div className="text-xl font-bold text-brand-warning mb-1">
                        {kycRefreshData.filter(item => item.priority === 'MEDIUM').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Medium Priority</div>
                    </div>
                    
                    <div className="text-center p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div className="text-xl font-bold text-red-400 mb-1">
                        {kycRefreshData.filter(item => item.priority === 'HIGH').length}
                      </div>
                      <div className="text-sm text-muted-foreground">High Priority</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* User Management Quick Stats */}
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Users className="h-5 w-5 text-brand-accent" />
                    <span>User Management</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Quick overview of system users and their activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-foreground mb-1">3</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-400 mb-1">3</div>
                      <div className="text-sm text-muted-foreground">Active Users</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-brand-warning mb-1">1</div>
                      <div className="text-sm text-muted-foreground">Training Due</div>
                    </div>
                    
                    <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-brand-accent mb-1">85%</div>
                      <div className="text-sm text-muted-foreground">Compliance Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}