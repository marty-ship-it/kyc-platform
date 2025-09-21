import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Upload,
  FileText,
  CreditCard,
  Home,
  Building,
  Shield,
  Check,
  X,
  Clock,
  AlertCircle,
  ExternalLink
} from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface KYCPageProps {
  params: {
    id: string
  }
}

const documentTypes = [
  {
    id: 'passport',
    name: 'Passport',
    icon: <CreditCard className="w-5 h-5" />,
    required: true,
    description: 'Primary identity document'
  },
  {
    id: 'driver_licence',
    name: 'Driver Licence',
    icon: <CreditCard className="w-5 h-5" />,
    required: false,
    description: 'Government-issued photo ID'
  },
  {
    id: 'medicare',
    name: 'Medicare Card',
    icon: <Shield className="w-5 h-5" />,
    required: false,
    description: 'Healthcare identification'
  },
  {
    id: 'utility_bill',
    name: 'Utility Bill',
    icon: <Home className="w-5 h-5" />,
    required: false,
    description: 'Proof of address (within 3 months)'
  },
  {
    id: 'company_extract',
    name: 'Company Extract',
    icon: <Building className="w-5 h-5" />,
    required: false,
    description: 'For company verification'
  }
]

async function getEntityWithSettings(entityId: string) {
  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    include: {
      kycs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!entity) return null

  const orgSettings = await prisma.orgSettings.findFirst()

  return { entity, orgSettings }
}

export default async function EntityKYCPage({ params }: KYCPageProps) {
  const { id } = await params
  const data = await getEntityWithSettings(id)

  if (!data) {
    notFound()
  }

  const { entity, orgSettings } = data

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/entities/${entity.id}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Entity
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                KYC Documentation
              </h1>
              <p className="text-gray-600">
                {entity.fullName || entity.legalName} • {entity.kind}
              </p>
              {orgSettings && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Document Storage: {orgSettings.storeDocuments ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Badge variant="outline" className="text-xs ml-2">
                    KYC Valid for: {orgSettings.kycReuseMonths} months
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                Export KYC Report
              </Button>
              <Button>
                Submit KYC
              </Button>
            </div>
          </div>

          {/* Document Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documentTypes.map((docType) => (
              <Card key={docType.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {docType.icon}
                      <div>
                        <CardTitle className="text-lg">{docType.name}</CardTitle>
                        <p className="text-sm text-gray-500">{docType.description}</p>
                      </div>
                    </div>
                    {docType.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Verified Elsewhere Option */}
                  <div className="flex items-center space-x-2">
                    <Checkbox id={`${docType.id}-verified-elsewhere`} />
                    <Label htmlFor={`${docType.id}-verified-elsewhere`} className="text-sm">
                      Verified Elsewhere
                    </Label>
                  </div>

                  {/* File Upload (disabled if verified elsewhere or storeDocuments is false) */}
                  <div className={orgSettings?.storeDocuments ? '' : 'opacity-50'}>
                    <Label htmlFor={`${docType.id}-file`}>Upload Document</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Input
                        id={`${docType.id}-file`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={!orgSettings?.storeDocuments}
                      />
                      <Button size="sm" variant="outline" disabled={!orgSettings?.storeDocuments}>
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    {!orgSettings?.storeDocuments && (
                      <p className="text-xs text-gray-500 mt-1">
                        Document storage is disabled by organization settings
                      </p>
                    )}
                  </div>

                  {/* Document Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${docType.id}-number`}>Document Number</Label>
                      <Input
                        id={`${docType.id}-number`}
                        type="text"
                        placeholder="Enter document number"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${docType.id}-issuer`}>Issuer</Label>
                      <Select>
                        <SelectTrigger id={`${docType.id}-issuer`}>
                          <SelectValue placeholder="Select issuer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aus">Australia</SelectItem>
                          <SelectItem value="nsw">NSW</SelectItem>
                          <SelectItem value="vic">VIC</SelectItem>
                          <SelectItem value="qld">QLD</SelectItem>
                          <SelectItem value="sa">SA</SelectItem>
                          <SelectItem value="wa">WA</SelectItem>
                          <SelectItem value="tas">TAS</SelectItem>
                          <SelectItem value="act">ACT</SelectItem>
                          <SelectItem value="nt">NT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`${docType.id}-expiry`}>Expiry Date</Label>
                    <Input
                      id={`${docType.id}-expiry`}
                      type="date"
                    />
                  </div>

                  {/* Verification Details (if verified elsewhere) */}
                  <div className="space-y-4 pt-2 border-t">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${docType.id}-verifier`}>Verified By</Label>
                        <Input
                          id={`${docType.id}-verifier`}
                          type="text"
                          placeholder="Name or organization"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${docType.id}-verified-date`}>Verification Date</Label>
                        <Input
                          id={`${docType.id}-verified-date`}
                          type="date"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Verified</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Verify Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Previous KYC Checks */}
          <Card>
            <CardHeader>
              <CardTitle>Previous KYC Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {entity.kycs.map((kyc) => (
                  <div key={kyc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        kyc.dvStatus === 'PASS' ? 'bg-green-100' :
                        kyc.dvStatus === 'FAIL' ? 'bg-red-100' :
                        'bg-yellow-100'
                      }`}>
                        {kyc.dvStatus === 'PASS' ? <Check className="w-5 h-5 text-green-600" /> :
                         kyc.dvStatus === 'FAIL' ? <X className="w-5 h-5 text-red-600" /> :
                         <Clock className="w-5 h-5 text-yellow-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {kyc.docType || 'Identity Verification'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(kyc.createdAt).toLocaleDateString('en-AU')} • 
                          Status: {kyc.dvStatus} • 
                          {kyc.verifiedElsewhere ? 'Verified Elsewhere' : 'Direct Verification'}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {entity.kycs.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No previous verifications</h3>
                    <p className="text-gray-600">This will be the first KYC verification for this entity.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}