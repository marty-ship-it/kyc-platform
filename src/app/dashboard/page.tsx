'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-bg via-brand-elevated to-brand-bg">
      <div className="text-lg text-foreground">Loading...</div>
    </div>
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-bg via-brand-elevated to-brand-bg">
      <div className="text-lg text-foreground">Redirecting to login...</div>
    </div>
  }

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen relative">
        <Navbar />
        
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
                  Welcome back, {session.user?.name}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Here's your compliance overview for today
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild className="bg-brand-accent hover:bg-brand-accent-600 text-brand-bg">
                  <Link href="/entities">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Entity Workspace
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Key Metrics */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={cardVariants}>
              <Card className="glass-card border-white/10 hover:border-brand-accent/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Compliance Score</p>
                      <p className={`text-3xl font-bold ${getComplianceScoreColor(stats.complianceScore)}`}>
                        {stats.complianceScore}%
                      </p>
                    </div>
                    <Shield className="w-10 h-10 text-brand-accent" />
                  </div>
                  <div className="mt-4 flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +2% from last month
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card className="glass-card border-white/10 hover:border-brand-accent/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Deals</p>
                      <p className="text-3xl font-bold text-foreground">{stats.activeDeals}</p>
                    </div>
                    <FileText className="w-10 h-10 text-emerald-400" />
                  </div>
                  <div className="mt-4 flex items-center text-xs text-muted-foreground">
                    <Activity className="w-3 h-3 mr-1" />
                    2 new this week
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card className="glass-card border-white/10 hover:border-red-400/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Pending Alerts</p>
                      <p className="text-3xl font-bold text-brand-warning">{stats.pendingAlerts}</p>
                    </div>
                    <AlertTriangle className="w-10 h-10 text-brand-warning" />
                  </div>
                  <div className="mt-4 flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    Action required
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={cardVariants}>
              <Card className="glass-card border-white/10 hover:border-blue-400/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Training Due</p>
                      <p className="text-3xl font-bold text-blue-400">{stats.trainingDue}</p>
                    </div>
                    <BookOpen className="w-10 h-10 text-blue-400" />
                  </div>
                  <div className="mt-4 flex items-center text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-1" />
                    Due next week
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Main Dashboard Grid */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="visible"
          >
            {/* Recent Activity */}
            <motion.div variants={cardVariants} className="lg:col-span-2">
              <Card className="glass-card border-white/10 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-brand-accent" />
                    <span>Recent Activity</span>
                  </CardTitle>
                  <CardDescription>Latest compliance actions and updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div className="flex items-center justify-between p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">KYC Completed</p>
                        <p className="text-xs text-muted-foreground">James Chen - Deal #JC-2024-001</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">2 min ago</span>
                  </motion.div>

                  <motion.div className="flex items-center justify-between p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-brand-warning" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Screening Alert</p>
                        <p className="text-xs text-muted-foreground">Margaret Wilson - PEP Match</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">1 hour ago</span>
                  </motion.div>

                  <motion.div className="flex items-center justify-between p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Report Generated</p>
                        <p className="text-xs text-muted-foreground">AUSTRAC TTR - Q3 2024</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">3 hours ago</span>
                  </motion.div>

                  <motion.div className="flex items-center justify-between p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Training Completed</p>
                        <p className="text-xs text-muted-foreground">AML/CTF Module 3 - Sarah Mitchell</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">5 hours ago</span>
                  </motion.div>

                  <motion.div className="pt-4" whileHover={{ scale: 1.02 }}>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/audit">
                        View All Activity
                      </Link>
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Risk & System Status */}
            <motion.div variants={cardVariants} className="space-y-6">
              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-brand-accent" />
                    <span>Risk Assessment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Risk Level</span>
                    <Badge className={getRiskLevelColor(stats.riskLevel)} variant="outline">
                      {stats.riskLevel}
                    </Badge>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-brand-warning h-2 rounded-full" 
                      style={{ width: stats.riskLevel === 'MEDIUM' ? '60%' : stats.riskLevel === 'HIGH' ? '90%' : '30%' }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on current deal portfolio and screening results
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-brand-accent" />
                    <span>System Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <motion.div className="flex items-center justify-between p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <span className="text-sm text-foreground">KYC Services</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
                      Online
                    </Badge>
                  </motion.div>
                  <motion.div className="flex items-center justify-between p-3 bg-white/5 rounded-lg" whileHover={{ scale: 1.02 }}>
                    <span className="text-sm text-foreground">Screening API</span>
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
  )
}