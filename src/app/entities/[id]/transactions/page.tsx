'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { 
  ArrowLeft, 
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Globe,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

interface Transaction {
  id: string
  entityId: string
  type: string
  amount: number
  currency: string
  direction: string
  counterparty: string
  method: string
  overseasAccount: boolean
  isCrossBorder: boolean
  isInternal: boolean
  receivedAt: string
  createdAt: string
}

export default function EntityTransactionsPage() {
  const params = useParams()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('12')
  
  useEffect(() => {
    fetchTransactions()
  }, [params.id])

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/entities/${params.id}/transactions`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const fyStart = currentMonth >= 6 ? new Date(currentYear, 6, 1) : new Date(currentYear - 1, 6, 1)
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())

    const lifetime = transactions.reduce((sum, t) => sum + (t.direction === 'IN' ? t.amount : -t.amount), 0)
    
    const fyToDate = transactions
      .filter(t => new Date(t.receivedAt) >= fyStart)
      .reduce((sum, t) => sum + (t.direction === 'IN' ? t.amount : -t.amount), 0)
    
    const last12Months = transactions
      .filter(t => new Date(t.receivedAt) >= twelveMonthsAgo)
      .reduce((sum, t) => sum + (t.direction === 'IN' ? t.amount : -t.amount), 0)

    return { lifetime, fyToDate, last12Months }
  }

  // Prepare data for charts
  const prepareLineChartData = () => {
    const monthlyData = new Map()
    
    transactions.forEach(t => {
      const date = new Date(t.receivedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { month: monthKey, in: 0, out: 0, net: 0 })
      }
      
      const data = monthlyData.get(monthKey)
      if (t.direction === 'IN') {
        data.in += t.amount
      } else {
        data.out += t.amount
      }
      data.net = data.in - data.out
    })
    
    return Array.from(monthlyData.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map(d => ({
        month: new Date(d.month + '-01').toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
        in: d.in,
        out: d.out,
        net: d.net
      }))
  }

  const prepareBarChartData = () => {
    const monthlyTotals = new Map()
    
    transactions.forEach(t => {
      const date = new Date(t.receivedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyTotals.has(monthKey)) {
        monthlyTotals.set(monthKey, { month: monthKey, total: 0 })
      }
      
      monthlyTotals.get(monthKey).total += t.amount
    })
    
    return Array.from(monthlyTotals.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map(d => ({
        month: new Date(d.month + '-01').toLocaleDateString('en-AU', { month: 'short' }),
        total: d.total
      }))
  }

  const preparePieChartData = () => {
    const typeData = new Map()
    
    transactions.forEach(t => {
      if (!typeData.has(t.type)) {
        typeData.set(t.type, 0)
      }
      typeData.set(t.type, typeData.get(t.type) + t.amount)
    })
    
    return Array.from(typeData.entries()).map(([type, amount]) => ({
      name: type,
      value: amount
    }))
  }

  const totals = calculateTotals()
  const lineChartData = prepareLineChartData()
  const barChartData = prepareBarChartData()
  const pieChartData = preparePieChartData()

  const exportChart = (chartType: string) => {
    // In a real implementation, this would export the chart as PNG
    alert(`Export ${chartType} chart functionality would be implemented here`)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/entities/${params.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Entity
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Transaction Analysis
              </h1>
              <p className="text-gray-600">
                {transactions.length} transactions recorded
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 months</SelectItem>
                  <SelectItem value="6">Last 6 months</SelectItem>
                  <SelectItem value="12">Last 12 months</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Totals Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Lifetime Total</p>
                    <p className="text-2xl font-bold">
                      ${totals.lifetime.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">FY to Date</p>
                    <p className="text-2xl font-bold">
                      ${totals.fyToDate.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Last 12 Months</p>
                    <p className="text-2xl font-bold">
                      ${totals.last12Months.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transaction Flow Over Time</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => exportChart('line')}>
                  <Download className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="in" stroke="#10b981" name="Inflow" />
                    <Line type="monotone" dataKey="out" stroke="#ef4444" name="Outflow" />
                    <Line type="monotone" dataKey="net" stroke="#3b82f6" name="Net" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Monthly Totals</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => exportChart('bar')}>
                  <Download className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="total" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Transaction Types</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => exportChart('pie')}>
                  <Download className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          txn.direction === 'IN' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {txn.direction === 'IN' ? (
                            <ArrowDownRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{txn.type}</p>
                          <p className="text-xs text-gray-500">{txn.counterparty}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${txn.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(txn.receivedAt).toLocaleDateString('en-AU')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Flags Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Flags Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Globe className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-2xl font-bold">
                      {transactions.filter(t => t.overseasAccount).length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Overseas Accounts</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <ArrowUpRight className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="text-2xl font-bold">
                      {transactions.filter(t => t.isCrossBorder).length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Cross-Border</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-2xl font-bold">
                      {transactions.filter(t => t.isInternal).length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Internal Transfers</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 text-orange-600 mr-2" />
                    <span className="text-2xl font-bold">
                      {transactions.filter(t => t.amount > 10000).length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">&gt; $10,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}