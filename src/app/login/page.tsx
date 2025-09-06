'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/')
      }
    } catch (err) {
      setError('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-bg via-brand-elevated to-brand-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-accent/10 via-transparent to-transparent" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <Card className="w-full max-w-md glass-card border-white/10">
          <CardHeader className="space-y-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Image
                src="/kycira-logo.svg"
                alt="Kycira"
                width={120}
                height={32}
                className="h-10 w-auto mx-auto mb-4"
              />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-heading font-bold text-foreground">
                Welcome back
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Sign in to your premium compliance platform
              </CardDescription>
            </div>
          </CardHeader>
        <CardContent>
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@company.com"
                required
                className="bg-white/5 border-white/10 focus:border-brand-accent transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/5 border-white/10 focus:border-brand-accent transition-colors"
              />
            </div>
            {error && (
              <motion.div 
                className="text-brand-danger text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {error}
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                type="submit" 
                className="w-full bg-brand-accent hover:bg-brand-accent-600 text-brand-bg font-semibold h-11 transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </motion.div>
          </motion.form>
          
          <motion.div 
            className="mt-6 p-4 bg-brand-accent/5 border border-brand-accent/20 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <h3 className="text-sm font-semibold text-brand-accent mb-3">Demo Access:</h3>
            <div className="text-xs text-muted-foreground space-y-2">
              <div><strong className="text-foreground">Director:</strong> sarah@coastalrealty.com / Password123!</div>
              <div><strong className="text-foreground">Agent:</strong> luca@coastalrealty.com / Password123!</div>
              <div><strong className="text-foreground">Compliance:</strong> priya@coastalrealty.com / Password123!</div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  )
}