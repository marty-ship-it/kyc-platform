'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/layout/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText, 
  User, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  CreditCard, 
  Download,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  DollarSign
} from 'lucide-react'
import { DvsClient } from '@/lib/services/dvsClient'
import { ScreeningClient } from '@/lib/services/screeningClient'
import { BankFeedClient } from '@/lib/services/bankFeed'

interface Deal {
  id: string
  address: string
  price: number
  buyer: { name: string; id: string }
  seller: { name: string; id: string }
  status: string
  currentStep: string
}

export default function DealDetailsPage() {
  const params = useParams()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [kycStatus, setKycStatus] = useState<string>('pending')
  const [screeningStatus, setScreeningStatus] = useState<string>('pending')
  const [riskStatus, setRiskStatus] = useState<string>('pending')
  const [riskScore, setRiskScore] = useState<string>('MEDIUM')
  const [riskRationale, setRiskRationale] = useState<string>('')
  const [sourceOfFunds, setSourceOfFunds] = useState<string>('')
  const [reportsStatus, setReportsStatus] = useState<string>('pending')
  const [transactions, setTransactions] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Mock deal data
    setDeal({
      id: params.id as string,
      address: '12 Seaview Rd, Bondi NSW',
      price: 1200000,
      buyer: { name: 'James Chen', id: 'buyer-1' },
      seller: { name: 'Margaret Wilson', id: 'seller-1' },
      status: 'ACTIVE',
      currentStep: 'KYC'
    })
  }, [params.id])

  const handleKycCheck = async () => {
    setLoading(true)
    try {
      const result = await DvsClient.verifyDocument('123456789', 'passport')
      setKycStatus(result.status === 'PASS' ? 'passed' : 'failed')
    } catch (error) {
      setKycStatus('failed')
    }
    setLoading(false)
  }

  const handleScreening = async () => {
    setLoading(true)
    try {
      const result = await ScreeningClient.screenPerson('James Chen', '1985-03-15')
      setScreeningStatus('completed')
      setRiskScore(result.riskScore)
    } catch (error) {
      setScreeningStatus('failed')
    }
    setLoading(false)
  }

  const handleBankFeedImport = async () => {
    setLoading(true)
    try {
      const bankTransactions = await BankFeedClient.importTransactions()
      setTransactions(bankTransactions)
    } catch (error) {
      console.error('Failed to import transactions')
    }
    setLoading(false)
  }

  const handleSaveRiskAssessment = async () => {
    if (!riskRationale.trim()) {
      alert('Please provide a risk assessment rationale before saving.')
      return
    }

    setLoading(true)
    try {
      // Simulate API call to save risk assessment
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setRiskStatus('completed')
      alert('Risk assessment saved successfully!')
    } catch (error) {
      console.error('Failed to save risk assessment:', error)
      alert('Failed to save risk assessment. Please try again.')
    }
    setLoading(false)
  }

  const handleGenerateReport = async () => {
    if (!deal) return
    
    setLoading(true)
    try {
      const reportData = {
        dealId: deal.id,
        dealAddress: deal.address,
        dealPrice: deal.price,
        reportType: 'TTR' as const,
        generatedAt: new Date().toISOString(),
        parties: [
          { name: deal.buyer.name, role: 'Buyer', riskScore }
        ],
        transactions: transactions.slice(0, 3).map(t => ({
          amount: t.amount,
          date: t.date,
          counterparty: t.counterparty
        })),
        complianceOfficer: 'Priya Sharma'
      }
      
      const response = await fetch('/api/reports/austrac-pack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `austrac-pack-${deal.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      
      // Mark reports as completed
      setReportsStatus('completed')
      alert('AUSTRAC Pack generated successfully! Reports workflow completed.')
      
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate PDF report. Please try again.')
    }
    setLoading(false)
  }

  if (!deal) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-slate-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-slate-100 text-slate-800'
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{deal.address}</h1>
                <p className="text-muted-foreground mt-2">
                  ${deal.price.toLocaleString('en-AU')} • {deal.buyer.name} → {deal.seller.name}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                {deal.status.toLowerCase()}
              </Badge>
            </div>
          </div>

          {/* Progress Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Compliance Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                {[
                  { step: 'KYC', status: kycStatus },
                  { step: 'Screening', status: screeningStatus },
                  { step: 'Risk', status: riskStatus },
                  { step: 'Transactions', status: transactions.length > 0 ? 'completed' : 'pending' },
                  { step: 'Reports', status: reportsStatus }
                ].map((item, index) => (
                  <div key={item.step} className="flex items-center space-x-2">
                    {getStatusIcon(item.status)}
                    <span className={`text-sm font-medium ${
                      item.status === 'completed' || item.status === 'passed' 
                        ? 'text-green-800' 
                        : item.status === 'failed' 
                          ? 'text-red-800'
                          : 'text-muted-foreground'
                    }`}>
                      {item.step}
                    </span>
                    {index < 4 && <span className="text-gray-300">→</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="parties">Parties</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
              <TabsTrigger value="screening">Screening</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Deal Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Property Address</Label>
                      <p className="text-lg font-medium">{deal.address}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Purchase Price</Label>
                      <p className="text-lg font-medium">${deal.price.toLocaleString('en-AU')}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Buyer</Label>
                        <p className="font-medium">{deal.buyer.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Seller</Label>
                        <p className="font-medium">{deal.seller.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>KYC Verification</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(kycStatus)}
                        <span className="text-sm capitalize">{kycStatus}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Screening</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(screeningStatus)}
                        <span className="text-sm capitalize">{screeningStatus}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Risk Level</span>
                      <Badge className={getRiskColor(riskScore)}>{riskScore}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Transactions Imported</span>
                      <span className="text-sm">{transactions.length} records</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="parties" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Buyer Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input value="James Chen" readOnly />
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <Input value="15/03/1985" readOnly />
                    </div>
                    <div>
                      <Label>Country of Residence</Label>
                      <Input value="Australia" readOnly />
                    </div>
                    <div>
                      <Label>Document Type</Label>
                      <Input value="Australian Passport" readOnly />
                    </div>
                    <div>
                      <Label>Document Number</Label>
                      <Input value="123456789" readOnly />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Seller Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input value="Margaret Wilson" readOnly />
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <Input value="22/07/1958" readOnly />
                    </div>
                    <div>
                      <Label>Country of Residence</Label>
                      <Input value="Australia" readOnly />
                    </div>
                    <div>
                      <Label>Document Type</Label>
                      <Input value="Australian Driver's License" readOnly />
                    </div>
                    <div>
                      <Label>Document Number</Label>
                      <Input value="NSW12345" readOnly />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="kyc" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>KYC Verification - {deal.buyer.name}</span>
                  </CardTitle>
                  <CardDescription>
                    Verify customer identity using Document Verification Service (DVS)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">DVS Document Check</h4>
                      <p className="text-sm text-muted-foreground">Passport 123456789</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(kycStatus)}
                      <Button 
                        onClick={handleKycCheck} 
                        disabled={loading}
                        variant={kycStatus === 'passed' ? 'secondary' : 'default'}
                        className={kycStatus !== 'passed' ? 'bg-[#49e1f3] hover:bg-[#35d4ea] text-black border-[#49e1f3]' : ''}
                      >
                        {loading ? 'Checking...' : kycStatus === 'passed' ? 'Re-run Check' : 'Run KYC Check'}
                      </Button>
                    </div>
                  </div>

                  {kycStatus === 'passed' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">DVS Verification Successful</span>
                      </div>
                      <div className="text-sm text-green-700 space-y-1">
                        <p>✓ Document authenticity verified</p>
                        <p>✓ Identity details match records</p>
                        <p>✓ Document is current and valid</p>
                        <p>Verification Score: 95/100</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Document Upload</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload passport or ID document
                          </p>
                          <Button variant="outline" size="sm">
                            Choose File
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500">
                          Accepted formats: PDF, JPG, PNG (Max 10MB)
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Proof of Address</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload utility bill or bank statement
                          </p>
                          <Button variant="outline" size="sm">
                            Choose File
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500">
                          Document must be dated within 3 months
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Liveness Check</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Facial verification completed</p>
                          <p className="text-sm text-muted-foreground">Live person detected, matches document photo</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Passed</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="screening" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>PEP, Sanctions & Adverse Media Screening</span>
                  </CardTitle>
                  <CardDescription>
                    Screen customer against global watchlists and adverse media
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Comprehensive Screening - {deal.buyer.name}</h4>
                      <p className="text-sm text-muted-foreground">PEP, Sanctions, Adverse Media</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(screeningStatus)}
                      <Button 
                        onClick={handleScreening} 
                        disabled={loading}
                        variant={screeningStatus === 'completed' ? 'secondary' : 'default'}
                        className={screeningStatus !== 'completed' ? 'bg-[#49e1f3] hover:bg-[#35d4ea] text-black border-[#49e1f3]' : ''}
                      >
                        {loading ? 'Screening...' : screeningStatus === 'completed' ? 'Re-run Screening' : 'Run Screening'}
                      </Button>
                    </div>
                  </div>

                  {screeningStatus === 'completed' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center space-x-2">
                            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                            <span>PEP Check</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-semibold text-green-600">Clear</p>
                          <p className="text-xs text-muted-foreground">No PEP matches found</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center space-x-2">
                            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                            <span>Sanctions</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-semibold text-green-600">Clear</p>
                          <p className="text-xs text-muted-foreground">No sanctions matches</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center space-x-2">
                            <div className="h-3 w-3 bg-slate-500 rounded-full"></div>
                            <span>Adverse Media</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-semibold text-slate-600">Alert</p>
                          <p className="text-xs text-muted-foreground">1 potential match found</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {screeningStatus === 'completed' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-slate-800">Adverse Media Alert</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-slate-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-800">Medium Risk - Offshore Investment Fund</h4>
                              <p className="text-sm text-slate-700 mt-1">
                                Australian Financial Review - "Property investor linked to offshore investment fund"
                              </p>
                              <p className="text-xs text-slate-600 mt-2">
                                Relevance Score: 65% • Date: 15 Aug 2023
                              </p>
                              <div className="mt-3">
                                <Label htmlFor="screening-notes" className="text-sm font-medium">
                                  Compliance Notes
                                </Label>
                                <Textarea 
                                  id="screening-notes"
                                  placeholder="Add notes about this alert and any risk mitigation measures..."
                                  className="mt-1"
                                  rows={3}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Risk Assessment</span>
                  </CardTitle>
                  <CardDescription>
                    Evaluate overall transaction risk based on multiple factors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="transaction-amount">Transaction Amount</Label>
                        <Input id="transaction-amount" value="$1,200,000" readOnly />
                      </div>
                      <div>
                        <Label htmlFor="source-of-funds">Source of Funds</Label>
                        <Input 
                          id="source-of-funds" 
                          placeholder="e.g., Investment proceeds, salary savings..." 
                          value={sourceOfFunds}
                          onChange={(e) => setSourceOfFunds(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer-risk">Customer Risk Rating</Label>
                        <Badge className={getRiskColor(riskScore)}>{riskScore}</Badge>
                      </div>
                      <div>
                        <Label htmlFor="transaction-complexity">Transaction Complexity</Label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Standard property purchase</option>
                          <option>Complex trust structure</option>
                          <option>Multiple entities involved</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="payment-method">Payment Method</Label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Bank transfer</option>
                          <option>Cashier's cheque</option>
                          <option>Cash</option>
                          <option>Multiple methods</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="geographic-risk">Geographic Risk</Label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Domestic (Australia)</option>
                          <option>Low-risk jurisdiction</option>
                          <option>Medium-risk jurisdiction</option>
                          <option>High-risk jurisdiction</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="business-relationship">Ongoing Business Relationship</Label>
                        <select className="w-full p-2 border rounded-md">
                          <option>New customer</option>
                          <option>Existing customer (&lt; 1 year)</option>
                          <option>Existing customer (1-3 years)</option>
                          <option>Long-term customer (&gt; 3 years)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-800">Calculated Risk Score</h4>
                      <Badge className={getRiskColor(riskScore)}>{riskScore}</Badge>
                    </div>
                    <p className="text-sm text-slate-700">
                      Based on adverse media alert and transaction amount. Enhanced due diligence recommended.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="risk-rationale">Risk Assessment Rationale</Label>
                    <Textarea 
                      id="risk-rationale"
                      placeholder="Explain the rationale for the risk rating and any mitigation measures..."
                      rows={4}
                      className="mt-2"
                      value={riskRationale}
                      onChange={(e) => setRiskRationale(e.target.value)}
                    />
                  </div>

                  <Button 
                    className="w-full bg-[#49e1f3] hover:bg-[#35d4ea] text-black border-[#49e1f3]" 
                    onClick={handleSaveRiskAssessment}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Risk Assessment'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Transaction Monitoring</span>
                  </CardTitle>
                  <CardDescription>
                    Import and monitor transactions for threshold and suspicious activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Bank Feed Import</h4>
                      <p className="text-sm text-muted-foreground">Import transactions from trust account</p>
                    </div>
                    <Button 
                      onClick={handleBankFeedImport} 
                      disabled={loading}
                      variant={transactions.length > 0 ? 'secondary' : 'default'}
                      className={transactions.length === 0 ? 'bg-[#49e1f3] hover:bg-[#35d4ea] text-black border-[#49e1f3]' : ''}
                    >
                      {loading ? 'Importing...' : transactions.length > 0 ? 'Re-import' : 'Ingest Bank Feed'}
                    </Button>
                  </div>

                  {transactions.length > 0 && (
                    <>
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-800">Threshold Transaction Alert</span>
                        </div>
                        <p className="text-sm text-red-700">
                          Transaction exceeds $10,000 AUD threshold. TTR (Threshold Transaction Report) required.
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                              <th className="border border-gray-200 px-4 py-2 text-left">Amount</th>
                              <th className="border border-gray-200 px-4 py-2 text-left">Counterparty</th>
                              <th className="border border-gray-200 px-4 py-2 text-left">Method</th>
                              <th className="border border-gray-200 px-4 py-2 text-left">Reference</th>
                              <th className="border border-gray-200 px-4 py-2 text-center">Alerts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((transaction, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-200 px-4 py-2">
                                  {new Date(transaction.date).toLocaleDateString('en-AU')}
                                </td>
                                <td className="border border-gray-200 px-4 py-2">
                                  <span className={`font-medium ${transaction.amount >= 10000 ? 'text-red-600' : ''}`}>
                                    ${transaction.amount.toLocaleString('en-AU')}
                                  </span>
                                </td>
                                <td className="border border-gray-200 px-4 py-2">{transaction.counterparty}</td>
                                <td className="border border-gray-200 px-4 py-2">
                                  <Badge variant="outline">{transaction.method}</Badge>
                                </td>
                                <td className="border border-gray-200 px-4 py-2 text-sm">{transaction.reference}</td>
                                <td className="border border-gray-200 px-4 py-2 text-center">
                                  {transaction.amount >= 10000 && (
                                    <Badge className="bg-red-100 text-red-800">TTR</Badge>
                                  )}
                                  {transaction.crossBorder && (
                                    <Badge className="bg-blue-100 text-blue-800 ml-1">IFTI</Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p>No transactions imported yet.</p>
                      <p className="text-sm">Click "Ingest Bank Feed" to import transaction data.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>AUSTRAC Reporting</span>
                  </CardTitle>
                  <CardDescription>
                    Generate required compliance reports for AUSTRAC
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {transactions.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">TTR Required</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Threshold Transaction Report required for $1,200,000 deposit received from James Chen Trust Account.
                      </p>
                      <div className="flex space-x-3">
                        <Button 
                          onClick={handleGenerateReport} 
                          disabled={loading}
                          className="flex items-center space-x-2 bg-[#49e1f3] hover:bg-[#35d4ea] text-black border-[#49e1f3]"
                        >
                          {loading ? (
                            <>Generating...</>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              <span>Generate AUSTRAC Pack</span>
                            </>
                          )}
                        </Button>
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview Report
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">TTR - Threshold Transaction Report</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm space-y-2">
                          <p><strong>Threshold:</strong> ≥ $10,000 AUD</p>
                          <p><strong>Timeframe:</strong> Report within 10 business days</p>
                          <p><strong>Status:</strong> <span className="text-red-600">Required</span></p>
                        </div>
                        {transactions.length > 0 && (
                          <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
                            <p><strong>Transaction:</strong> $1,200,000 from James Chen Trust Account</p>
                            <p><strong>Due Date:</strong> {new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AU')}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">SMR - Suspicious Matter Report</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm space-y-2">
                          <p><strong>Threshold:</strong> Suspicious activity (any amount)</p>
                          <p><strong>Timeframe:</strong> Report immediately</p>
                          <p><strong>Status:</strong> <span className="text-slate-600">Under Review</span></p>
                        </div>
                        <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded">
                          <p><strong>Trigger:</strong> Adverse media hit for offshore investment links</p>
                          <p><strong>Assessment:</strong> Medium risk - requires enhanced due diligence</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          Assess for SMR
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Report History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p>No reports generated yet.</p>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  )
}