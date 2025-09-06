'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/layout/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  User, 
  Award,
  Play,
  Download,
  Calendar
} from 'lucide-react'

interface TrainingCourse {
  id: string
  title: string
  description: string
  duration: string
  type: 'AML_BASICS' | 'KYC_101' | 'REPORTING'
  required: boolean
  status: 'completed' | 'in_progress' | 'not_started'
  completedAt?: string
  expiryDate?: string
}

interface StaffMember {
  id: string
  name: string
  role: string
  email: string
  trainingRecords: TrainingCourse[]
  complianceScore: number
}

export default function TrainingPage() {
  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: '1',
      name: 'Sarah Mitchell',
      role: 'Director',
      email: 'sarah@coastalrealty.com',
      complianceScore: 95,
      trainingRecords: [
        {
          id: '1',
          title: 'AML/CTF Fundamentals',
          description: 'Core principles and legal requirements',
          duration: '2 hours',
          type: 'AML_BASICS',
          required: true,
          status: 'completed',
          completedAt: '2024-01-10',
          expiryDate: '2025-01-10'
        },
        {
          id: '2',
          title: 'KYC Procedures & Best Practices',
          description: 'Customer due diligence and verification',
          duration: '1.5 hours',
          type: 'KYC_101',
          required: true,
          status: 'completed',
          completedAt: '2024-01-10',
          expiryDate: '2025-01-10'
        },
        {
          id: '3',
          title: 'AUSTRAC Reporting Requirements',
          description: 'TTR, SMR and compliance reporting',
          duration: '1 hour',
          type: 'REPORTING',
          required: false,
          status: 'completed',
          completedAt: '2024-01-10',
          expiryDate: '2025-01-10'
        }
      ]
    },
    {
      id: '2',
      name: 'Luca Romano',
      role: 'Agent',
      email: 'luca@coastalrealty.com',
      complianceScore: 78,
      trainingRecords: [
        {
          id: '1',
          title: 'AML/CTF Fundamentals',
          description: 'Core principles and legal requirements',
          duration: '2 hours',
          type: 'AML_BASICS',
          required: true,
          status: 'in_progress',
          expiryDate: '2024-12-15'
        },
        {
          id: '2',
          title: 'KYC Procedures & Best Practices',
          description: 'Customer due diligence and verification',
          duration: '1.5 hours',
          type: 'KYC_101',
          required: true,
          status: 'not_started'
        }
      ]
    },
    {
      id: '3',
      name: 'Priya Sharma',
      role: 'Compliance Officer',
      email: 'priya@coastalrealty.com',
      complianceScore: 100,
      trainingRecords: [
        {
          id: '1',
          title: 'AML/CTF Fundamentals',
          description: 'Core principles and legal requirements',
          duration: '2 hours',
          type: 'AML_BASICS',
          required: true,
          status: 'completed',
          completedAt: '2024-01-05',
          expiryDate: '2025-01-05'
        },
        {
          id: '2',
          title: 'KYC Procedures & Best Practices',
          description: 'Customer due diligence and verification',
          duration: '1.5 hours',
          type: 'KYC_101',
          required: true,
          status: 'completed',
          completedAt: '2024-01-05',
          expiryDate: '2025-01-05'
        },
        {
          id: '3',
          title: 'AUSTRAC Reporting Requirements',
          description: 'TTR, SMR and compliance reporting',
          duration: '1 hour',
          type: 'REPORTING',
          required: true,
          status: 'completed',
          completedAt: '2024-01-05',
          expiryDate: '2025-01-05'
        }
      ]
    }
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-brand-warning" />
      case 'not_started':
        return <BookOpen className="h-4 w-4 text-muted-foreground" />
      default:
        return <BookOpen className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'in_progress':
        return 'bg-brand-warning/10 text-brand-warning border-brand-warning/20'
      case 'not_started':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400'
    if (score >= 75) return 'text-brand-warning'
    return 'text-brand-danger'
  }

  const totalStaff = staff.length
  const staffCompliant = staff.filter(s => s.complianceScore >= 85).length
  const overdueTraining = staff.reduce((acc, s) => {
    return acc + s.trainingRecords.filter(t => 
      t.status === 'not_started' || 
      (t.expiryDate && new Date(t.expiryDate) < new Date())
    ).length
  }, 0)

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-4xl font-heading font-bold text-foreground">Training Management</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              AML/CTF compliance training and certification tracking
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <Card className="glass-card hover:shadow-brand-elevation transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
                <User className="h-5 w-5 text-brand-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-1">{totalStaff}</div>
                <p className="text-xs text-muted-foreground">
                  Active team members
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-brand-elevation transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Compliant Staff</CardTitle>
                <Award className="h-5 w-5 text-brand-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-400 mb-1">{staffCompliant}</div>
                <p className="text-xs text-muted-foreground">
                  Score ≥ 85%
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-brand-elevation transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Training Due</CardTitle>
                <Clock className="h-5 w-5 text-brand-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-brand-danger mb-1">{overdueTraining}</div>
                <p className="text-xs text-muted-foreground">
                  Overdue courses
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-brand-elevation transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Rate</CardTitle>
                <CheckCircle className="h-5 w-5 text-brand-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-400 mb-1">
                  {Math.round((staffCompliant / totalStaff) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall compliance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Staff Training Records */}
          <div className="space-y-6">
            {staff.map(member => (
              <Card key={member.id} className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2 text-foreground">
                        <User className="h-5 w-5 text-brand-accent" />
                        <span>{member.name}</span>
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {member.role} • {member.email}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getComplianceScoreColor(member.complianceScore)}`}>
                        {member.complianceScore}%
                      </div>
                      <p className="text-xs text-muted-foreground">Compliance Score</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {member.trainingRecords.map(course => (
                      <div key={course.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(course.status)}
                          <div>
                            <h4 className="font-medium text-foreground">{course.title}</h4>
                            <p className="text-sm text-muted-foreground">{course.description}</p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                              <span>Duration: {course.duration}</span>
                              {course.required && (
                                <Badge variant="outline" className="text-xs bg-brand-danger/10 text-brand-danger border-brand-danger/20">Required</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <Badge variant="outline" className={getStatusColor(course.status)}>
                              {course.status.replace('_', ' ')}
                            </Badge>
                            {course.completedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Completed: {new Date(course.completedAt).toLocaleDateString('en-AU')}
                              </p>
                            )}
                            {course.expiryDate && (
                              <p className={`text-xs mt-1 ${
                                new Date(course.expiryDate) < new Date() ? 'text-brand-danger' : 'text-muted-foreground'
                              }`}>
                                Expires: {new Date(course.expiryDate).toLocaleDateString('en-AU')}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex space-x-2">
                            {course.status === 'not_started' && (
                              <Button size="sm" className="bg-brand-accent hover:bg-brand-accent-600 text-brand-bg">
                                <Play className="h-3 w-3 mr-1" />
                                Start
                              </Button>
                            )}
                            {course.status === 'in_progress' && (
                              <Button size="sm" variant="outline" className="hover:bg-brand-accent/10 hover:border-brand-accent/30">
                                <Play className="h-3 w-3 mr-1" />
                                Continue
                              </Button>
                            )}
                            {course.status === 'completed' && (
                              <Button size="sm" variant="outline" className="hover:bg-brand-accent/10 hover:border-brand-accent/30">
                                <Download className="h-3 w-3 mr-1" />
                                Certificate
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Available Courses */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Available Training Courses</CardTitle>
              <CardDescription>
                Comprehensive AML/CTF compliance training modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">AML/CTF Fundamentals</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Essential knowledge of anti-money laundering and counter-terrorism financing requirements.
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>Duration: 2 hours</span>
                    <Badge className="bg-red-100 text-red-800">Required</Badge>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>• Legal obligations and penalties</p>
                    <p>• Risk assessment fundamentals</p>
                    <p>• Record keeping requirements</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium">KYC Procedures</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Customer due diligence, identity verification, and ongoing monitoring procedures.
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>Duration: 1.5 hours</span>
                    <Badge className="bg-red-100 text-red-800">Required</Badge>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>• Identity verification methods</p>
                    <p>• Enhanced due diligence</p>
                    <p>• Beneficial ownership</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <h3 className="font-medium">AUSTRAC Reporting</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Threshold transaction reports, suspicious matter reports, and compliance obligations.
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>Duration: 1 hour</span>
                    <Badge variant="outline">Optional</Badge>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>• TTR requirements and thresholds</p>
                    <p>• SMR trigger events</p>
                    <p>• Reporting timeframes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Calendar */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Upcoming Training Deadlines</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <p className="font-medium text-red-800">Luca Romano - AML/CTF Fundamentals</p>
                    <p className="text-sm text-red-600">Overdue by 23 days</p>
                  </div>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Send Reminder
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-800">Sarah Mitchell - Annual Refresher</p>
                    <p className="text-sm text-slate-600">Due in 3 months</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Schedule
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-800">Priya Sharma - Advanced Compliance</p>
                    <p className="text-sm text-blue-600">Due in 6 months</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Schedule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}