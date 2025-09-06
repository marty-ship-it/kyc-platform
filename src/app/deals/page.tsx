'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Navbar from '@/components/layout/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Plus, 
  Search, 
  MapPin, 
  DollarSign, 
  Calendar,
  User
} from 'lucide-react'

interface Deal {
  id: string
  address: string
  price: number
  status: string
  createdAt: string
  buyer?: string
  seller?: string
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  currentStep: 'KYC' | 'SCREENING' | 'RISK' | 'TRANSACTIONS' | 'REPORTS' | 'COMPLETE'
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([
    {
      id: '1',
      address: '12 Seaview Rd, Bondi NSW',
      price: 1200000,
      status: 'ACTIVE',
      createdAt: '2024-01-15T10:30:00Z',
      buyer: 'James Chen',
      seller: 'Margaret Wilson',
      riskLevel: 'MEDIUM',
      currentStep: 'KYC'
    },
    {
      id: '2',
      address: '45 Collins St, Melbourne VIC',
      price: 2500000,
      status: 'ACTIVE',
      createdAt: '2024-01-10T15:20:00Z',
      buyer: 'Corporate Trust Pty Ltd',
      seller: 'Melbourne Property Group',
      riskLevel: 'HIGH',
      currentStep: 'COMPLETE'
    },
    {
      id: '3',
      address: '78 Beach Rd, Gold Coast QLD',
      price: 850000,
      status: 'ACTIVE',
      createdAt: '2024-01-08T09:15:00Z',
      buyer: 'Sarah Mitchell',
      seller: 'Gold Coast Developments',
      riskLevel: 'LOW',
      currentStep: 'SCREENING'
    }
  ])
  
  const [searchTerm, setSearchTerm] = useState('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'CANCELLED':
        return 'bg-brand-danger/10 text-brand-danger border-brand-danger/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
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

  const getStepColor = (step: string) => {
    switch (step) {
      case 'COMPLETE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'KYC':
      case 'SCREENING':
      case 'RISK':
        return 'bg-brand-warning/10 text-brand-warning border-brand-warning/20'
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }
  }

  const filteredDeals = deals.filter(deal =>
    deal.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.buyer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.seller?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading font-bold text-foreground">Property Deals</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Manage AML/CTF compliance for property transactions
                </p>
              </div>
              <Link href="/deals/new">
                <Button className="flex items-center space-x-2 bg-brand-accent hover:bg-brand-accent-600 text-brand-bg">
                  <Plus className="h-4 w-4" />
                  <span>New Deal</span>
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deals by address, buyer, or seller..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 focus:border-brand-accent transition-colors text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDeals.map(deal => (
              <Card key={deal.id} className="glass-card hover:shadow-brand-elevation transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center space-x-2 text-foreground">
                        <MapPin className="h-4 w-4 text-brand-accent" />
                        <span className="truncate">{deal.address}</span>
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-2 mt-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">${deal.price.toLocaleString('en-AU')}</span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Badge variant="outline" className={getStatusColor(deal.status)}>
                        {deal.status.toLowerCase()}
                      </Badge>
                      {deal.riskLevel && (
                        <Badge variant="outline" className={getRiskLevelColor(deal.riskLevel)}>
                          {deal.riskLevel.toLowerCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {deal.buyer && (
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3 text-brand-accent" />
                          <span className="text-muted-foreground">Buyer:</span>
                          <span className="font-medium text-foreground">{deal.buyer}</span>
                        </div>
                      )}
                      {deal.seller && (
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3 text-brand-accent" />
                          <span className="text-muted-foreground">Seller:</span>
                          <span className="font-medium text-foreground">{deal.seller}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3 text-brand-accent" />
                        <span className="text-muted-foreground">Created:</span>
                        <span className="text-foreground">{new Date(deal.createdAt).toLocaleDateString('en-AU')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">Current Step:</span>
                        <Badge variant="outline" className={getStepColor(deal.currentStep)}>
                          {deal.currentStep.toLowerCase()}
                        </Badge>
                      </div>
                      <Link href={`/deals/${deal.id}`}>
                        <Button variant="outline" size="sm" className="bg-[#49e1f3] hover:bg-[#35d4ea] text-black border-[#49e1f3]">
                          <FileText className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDeals.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No deals found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No deals match your search criteria.' : 'Get started by creating your first deal.'}
              </p>
              <Link href="/deals/new">
                <Button className="bg-brand-accent hover:bg-brand-accent-600 text-brand-bg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Deal
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}