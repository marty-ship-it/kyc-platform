'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/layout/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Shield, 
  Calendar, 
  Edit, 
  Eye,
  Download,
  History,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface PolicyDocument {
  id: string
  title: string
  version: string
  status: 'draft' | 'active' | 'expired'
  effectiveDate: string
  lastReviewed: string
  nextReview: string
  description: string
  owner: string
  sections: string[]
}

export default function PoliciesPage() {
  const [policies] = useState<PolicyDocument[]>([
    {
      id: '1',
      title: 'AML/CTF Program',
      version: '1.0',
      status: 'active',
      effectiveDate: '2024-01-01',
      lastReviewed: '2024-01-01',
      nextReview: '2025-01-01',
      description: 'Comprehensive Anti-Money Laundering and Counter-Terrorism Financing compliance program',
      owner: 'Priya Sharma',
      sections: [
        'Purpose and Scope',
        'Customer Due Diligence',
        'Enhanced Due Diligence',
        'Record Keeping',
        'Reporting Obligations',
        'Training and Awareness',
        'Risk Management',
        'Independent Review'
      ]
    },
    {
      id: '2',
      title: 'Customer Onboarding Procedures',
      version: '2.1',
      status: 'active',
      effectiveDate: '2024-02-01',
      lastReviewed: '2024-02-01',
      nextReview: '2025-02-01',
      description: 'Step-by-step procedures for customer identification and verification',
      owner: 'Luca Romano',
      sections: [
        'Identity Verification',
        'Document Collection',
        'DVS Integration',
        'Risk Assessment',
        'Approval Workflow'
      ]
    },
    {
      id: '3',
      title: 'Suspicious Transaction Monitoring',
      version: '1.2',
      status: 'draft',
      effectiveDate: '2024-03-01',
      lastReviewed: '2024-02-15',
      nextReview: '2025-03-01',
      description: 'Guidelines for identifying and reporting suspicious transactions',
      owner: 'Priya Sharma',
      sections: [
        'Transaction Monitoring',
        'Red Flag Indicators',
        'Investigation Procedures',
        'SMR Requirements',
        'Documentation Standards'
      ]
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'draft':
        return 'bg-brand-warning/10 text-brand-warning border-brand-warning/20'
      case 'expired':
        return 'bg-brand-danger/10 text-brand-danger border-brand-danger/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />
      case 'draft':
        return <Clock className="h-4 w-4 text-brand-warning" />
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-brand-danger" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const isReviewDue = (nextReview: string) => {
    const reviewDate = new Date(nextReview)
    const today = new Date()
    const daysUntilReview = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
    return daysUntilReview <= 90 // Due within 3 months
  }

  const activePolicies = policies.filter(p => p.status === 'active').length
  const draftPolicies = policies.filter(p => p.status === 'draft').length
  const reviewsDue = policies.filter(p => isReviewDue(p.nextReview)).length

  const amlProgramContent = `# AML/CTF Compliance Program

## Purpose
This program is designed to ensure compliance with the Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (AML/CTF Act).

## Scope
This program applies to all designated services provided by Coastal Realty Pty Ltd, including:
- Real estate transactions above $10,000
- Property management services
- Commercial property transactions

## Customer Due Diligence (CDD)

### Standard CDD
- Verify customer identity using reliable and independent documents
- Obtain customer information including full name, date of birth, residential address
- Conduct ongoing customer due diligence

### Enhanced Due Diligence (EDD)
Required for:
- High-risk customers
- Politically Exposed Persons (PEPs)
- Transactions involving high-risk countries
- Complex or unusual large transactions

## Record Keeping
All records must be kept for a minimum of 7 years and include:
- Customer identification documents
- Transaction records
- Account files
- Correspondence with customers

## Reporting Obligations

### Threshold Transaction Reports (TTRs)
- Report cash transactions of $10,000 or more
- Submit within 10 business days

### Suspicious Matter Reports (SMRs)
- Report suspicious transactions immediately
- No minimum threshold amount

## Training and Awareness
All staff must complete AML/CTF training:
- Initial training within 30 days of commencement
- Annual refresher training
- Specialised training for compliance staff

## Risk Management
- Conduct regular risk assessments
- Implement appropriate risk mitigation measures
- Monitor and review risk controls

## Independent Review
- Annual independent review of AML/CTF program
- Review by qualified external auditor
- Address any identified deficiencies

## Review and Updates
This program will be reviewed annually or when legislative changes occur.

---
*Document Version: 1.0*  
*Effective Date: 1 January 2024*  
*Next Review: 1 January 2025*  
*Owner: Priya Sharma, Compliance Officer*`

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-4xl font-heading font-bold text-foreground">Policy Management</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              AML/CTF compliance policies and procedures documentation
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <Card className="glass-card hover:shadow-brand-elevation transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Policies</CardTitle>
                <Shield className="h-5 w-5 text-brand-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-400 mb-1">{activePolicies}</div>
                <p className="text-xs text-muted-foreground">
                  Currently in effect
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-brand-elevation transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Draft Policies</CardTitle>
                <Edit className="h-5 w-5 text-brand-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-brand-warning mb-1">{draftPolicies}</div>
                <p className="text-xs text-muted-foreground">
                  Under development
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-brand-elevation transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Reviews Due</CardTitle>
                <Calendar className="h-5 w-5 text-brand-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-brand-danger mb-1">{reviewsDue}</div>
                <p className="text-xs text-muted-foreground">
                  Within 3 months
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover:shadow-brand-elevation transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Level</CardTitle>
                <CheckCircle className="h-5 w-5 text-brand-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-400 mb-1">95%</div>
                <p className="text-xs text-muted-foreground">
                  Policy adherence
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="policies" className="space-y-6">
            <TabsList className="glass-card">
              <TabsTrigger value="policies" className="data-[state=active]:bg-brand-accent data-[state=active]:text-brand-bg">Policy Library</TabsTrigger>
              <TabsTrigger value="viewer" className="data-[state=active]:bg-brand-accent data-[state=active]:text-brand-bg">Document Viewer</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-brand-accent data-[state=active]:text-brand-bg">Version History</TabsTrigger>
            </TabsList>

            <TabsContent value="policies" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {policies.map(policy => (
                  <Card key={policy.id} className="glass-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center space-x-2 text-foreground">
                            {getStatusIcon(policy.status)}
                            <span>{policy.title}</span>
                            <Badge variant="outline" className="border-brand-accent/30 text-brand-accent">v{policy.version}</Badge>
                          </CardTitle>
                          <CardDescription className="mt-1 text-muted-foreground">
                            {policy.description}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className={getStatusColor(policy.status)}>
                          {policy.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Effective Date</p>
                          <p className="text-sm text-foreground">{new Date(policy.effectiveDate).toLocaleDateString('en-AU')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Last Reviewed</p>
                          <p className="text-sm text-foreground">{new Date(policy.lastReviewed).toLocaleDateString('en-AU')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Next Review</p>
                          <p className={`text-sm ${isReviewDue(policy.nextReview) ? 'text-brand-danger' : 'text-foreground'}`}>
                            {new Date(policy.nextReview).toLocaleDateString('en-AU')}
                            {isReviewDue(policy.nextReview) && (
                              <Badge variant="outline" className="bg-brand-danger/10 text-brand-danger border-brand-danger/20 ml-2 text-xs">Due Soon</Badge>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Owner</p>
                          <p className="text-sm text-foreground">{policy.owner}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Sections</p>
                        <div className="flex flex-wrap gap-2">
                          {policy.sections.map((section, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-white/20 text-muted-foreground">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="hover:bg-brand-accent/10 hover:border-brand-accent/30">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-brand-accent/10 hover:border-brand-accent/30">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        {policy.status !== 'active' && (
                          <Button variant="outline" size="sm" className="hover:bg-brand-accent/10 hover:border-brand-accent/30">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="hover:bg-brand-accent/10 hover:border-brand-accent/30">
                          <History className="h-3 w-3 mr-1" />
                          History
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="viewer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>AML/CTF Program - Version 1.0</span>
                  </CardTitle>
                  <CardDescription>
                    Effective from 1 January 2024 • Owner: Priya Sharma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="bg-gray-50 p-6 rounded-lg border">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {amlProgramContent}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Version History</span>
                  </CardTitle>
                  <CardDescription>
                    Track changes and updates to policy documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-green-800">AML/CTF Program v1.0</h4>
                        <p className="text-sm text-green-600">Initial policy release</p>
                        <p className="text-xs text-green-500">1 January 2024 • Priya Sharma</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Customer Onboarding Procedures v2.1</h4>
                        <p className="text-sm text-muted-foreground">Updated DVS integration requirements</p>
                        <p className="text-xs text-muted-foreground">1 February 2024 • Luca Romano</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Customer Onboarding Procedures v2.0</h4>
                        <p className="text-sm text-muted-foreground">Added risk assessment workflow</p>
                        <p className="text-xs text-muted-foreground">15 December 2023 • Luca Romano</p>
                      </div>
                      <Badge variant="outline">Superseded</Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-800">Suspicious Transaction Monitoring v1.2</h4>
                        <p className="text-sm text-slate-600">Enhanced investigation procedures</p>
                        <p className="text-xs text-slate-500">15 February 2024 • Priya Sharma</p>
                      </div>
                      <Badge className="bg-slate-100 text-slate-800">Draft</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Review Schedule */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Upcoming Policy Reviews</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <p className="font-medium text-red-800">Suspicious Transaction Monitoring</p>
                    <p className="text-sm text-red-600">Annual review overdue</p>
                  </div>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Schedule Review
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-800">AML/CTF Program</p>
                    <p className="text-sm text-blue-600">Due 1 January 2025 (11 months)</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Set Reminder
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-800">Customer Onboarding Procedures</p>
                    <p className="text-sm text-blue-600">Due 1 February 2025 (12 months)</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Set Reminder
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