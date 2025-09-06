'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/layout/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  TrendingUp, 
  Users,
  AlertCircle,
  BookOpen,
  Shield,
  DollarSign,
  Sparkles,
  Activity,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface DashboardStats {
  complianceScore: number
  activeDeals: number
  pendingAlerts: number
  trainingDue: number
  reportsGenerated: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    complianceScore: 85,
    activeDeals: 3,
    pendingAlerts: 2,
    trainingDue: 1,
    reportsGenerated: 12,
    riskLevel: 'MEDIUM'
  })

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400'
    if (score >= 75) return 'text-brand-warning'
    return 'text-brand-danger'
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'MEDIUM':
        return 'bg-brand-warning/10 text-brand-warning border-brand-warning/20'
      case 'HIGH':
        return 'bg-brand-danger/10 text-brand-danger border-brand-danger/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
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
            className="mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <Sparkles className="h-8 w-8 text-brand-accent" />
              <h1 className="text-4xl font-heading font-bold text-foreground">
                Welcome back, {session?.user.name}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Your intelligent compliance command center is ready
            </p>
          </motion.div>

          {/* Alert Banner */}
          {stats.pendingAlerts > 0 && (
            <motion.div 
              className="mb-8 glass-card border-brand-warning/20 bg-brand-warning/5 p-5 rounded-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-brand-warning mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {stats.pendingAlerts} pending compliance alert{stats.pendingAlerts !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Immediate attention required for regulatory compliance
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" className="border-brand-warning/30 hover:bg-brand-warning/10">
                    View Alerts
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card className="glass-card hover:shadow-brand-elevation transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Score</CardTitle>
                  <Shield className="h-5 w-5 text-brand-accent" />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getComplianceScoreColor(stats.complianceScore)} mb-1`}>
                    {stats.complianceScore}%
                  </div>
                  <p className="text-xs text-emerald-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2% from last month
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="glass-card hover:shadow-brand-elevation transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Deals</CardTitle>
                  <FileText className="h-5 w-5 text-brand-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-1">{stats.activeDeals}</div>
                  <p className="text-xs text-brand-warning">
                    2 require attention
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="glass-card hover:shadow-brand-elevation transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Risk Level</CardTitle>
                  <AlertCircle className="h-5 w-5 text-brand-accent" />
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className={`mb-2 ${getRiskLevelColor(stats.riskLevel)}`}>
                    {stats.riskLevel}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Based on recent transactions
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="glass-card hover:shadow-brand-elevation transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Training Due</CardTitle>
                  <BookOpen className="h-5 w-5 text-brand-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-1">{stats.trainingDue}</div>
                  <p className="text-xs text-muted-foreground">
                    staff member needs training
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Main Content Grid */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Recent Deals */}
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-foreground">
                    <span className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-brand-accent" />
                      <span>Active Deals</span>
                    </span>
                    <Link href="/deals">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" size="sm" className="border-brand-accent/30 hover:bg-brand-accent/10">
                          View All
                        </Button>
                      </motion.div>
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Properties currently under compliance review
                  </CardDescription>
                </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <motion.div 
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div>
                      <h4 className="font-medium text-foreground">12 Seaview Rd, Bondi NSW</h4>
                      <p className="text-sm text-muted-foreground">$1,200,000 • James Chen</p>
                    </div>
                    <Badge variant="outline" className="bg-brand-warning/10 text-brand-warning border-brand-warning/20">KYC Pending</Badge>
                  </motion.div>
                  <motion.div 
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div>
                      <h4 className="font-medium text-foreground">45 Collins St, Melbourne VIC</h4>
                      <p className="text-sm text-muted-foreground">$2,500,000 • Corporate Trust</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Complete</Badge>
                  </motion.div>
                  <motion.div 
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div>
                      <h4 className="font-medium text-foreground">78 Beach Rd, Gold Coast QLD</h4>
                      <p className="text-sm text-muted-foreground">$850,000 • Sarah Mitchell</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Screening</Badge>
                  </motion.div>
                </div>
              </CardContent>
              </Card>
            </motion.div>

            {/* Compliance Activities */}
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <Clock className="h-5 w-5 text-brand-accent" />
                    <span>Recent Activity</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Latest compliance actions and system updates
                  </CardDescription>
                </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <motion.div 
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">KYC check completed</p>
                      <p className="text-xs text-muted-foreground">12 Seaview Rd - James Chen verified</p>
                      <p className="text-xs text-slate-500">2 hours ago</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <AlertTriangle className="h-5 w-5 text-brand-warning mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Threshold transaction detected</p>
                      <p className="text-xs text-muted-foreground">$1.2M deposit requires TTR filing</p>
                      <p className="text-xs text-slate-500">4 hours ago</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <Clock className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Training reminder sent</p>
                      <p className="text-xs text-muted-foreground">AML refresher due for Luca Romano</p>
                      <p className="text-xs text-slate-500">1 day ago</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <FileText className="h-5 w-5 text-purple-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Policy updated</p>
                      <p className="text-xs text-muted-foreground">AML/CTF Program v1.1 published</p>
                      <p className="text-xs text-slate-500">3 days ago</p>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-brand-accent" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/deals/new" className="block">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full justify-start bg-brand-accent hover:bg-brand-accent-600 text-brand-bg">
                      <FileText className="h-4 w-4 mr-2" />
                      New Deal
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/training" className="block">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full justify-start" variant="outline">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Training Portal
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/policies" className="block">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full justify-start" variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      View Policies
                    </Button>
                  </motion.div>
                </Link>
              </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-brand-accent" />
                    <span>Upcoming Reviews</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div className="text-sm p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <p className="font-medium text-foreground">Annual Policy Review</p>
                    <p className="text-muted-foreground">Due in 11 months</p>
                  </motion.div>
                  <motion.div className="text-sm p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <p className="font-medium text-foreground">Staff Training Refresh</p>
                    <p className="text-brand-warning">2 staff members due</p>
                  </motion.div>
                  <motion.div className="text-sm p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <p className="font-medium text-foreground">Risk Assessment Update</p>
                    <p className="text-muted-foreground">Quarterly review pending</p>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-brand-accent" />
                    <span>System Health</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div className="flex items-center justify-between p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <span className="text-sm text-foreground">DVS Integration</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
                      Online
                    </Badge>
                  </motion.div>
                  <motion.div className="flex items-center justify-between p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <span className="text-sm text-foreground">Screening Services</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
                      Online
                    </Badge>
                  </motion.div>
                  <motion.div className="flex items-center justify-between p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <span className="text-sm text-foreground">Bank Feed</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
                      Online
                    </Badge>
                  </motion.div>
                  <motion.div className="flex items-center justify-between p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <span className="text-sm text-foreground">AUSTRAC Reporting</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
                      Ready
                    </Badge>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}