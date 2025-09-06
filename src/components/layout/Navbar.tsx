'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, FileText, Users, Settings, BookOpen, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Navbar() {
  const { data: session } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'DIRECTOR':
        return 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
      case 'COMPLIANCE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'AGENT':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  return (
    <motion.nav 
      className="glass-card border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Image
                  src="/kycira-logo.svg"
                  alt="Kycira"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                />
              </motion.div>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {[
                { href: '/', icon: Home, label: 'Dashboard' },
                { href: '/deals', icon: FileText, label: 'Deals' },
                { href: '/training', icon: BookOpen, label: 'Training' },
                { href: '/policies', icon: Settings, label: 'Policies' },
              ].map((item) => (
                <motion.div key={item.href} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={item.href}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all duration-200"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </motion.div>
              ))}
              
              {(session?.user?.role === 'DIRECTOR' || session?.user?.role === 'COMPLIANCE') && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/admin"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-white/5 transition-all duration-200"
                  >
                    <Users className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {session && (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <div className="font-medium text-foreground">{session.user.name}</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">{session.user.email}</span>
                    <Badge variant="outline" className={`text-xs border ${getRoleBadgeColor(session.user.role)}`}>
                      {session.user.role.toLowerCase()}
                    </Badge>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </Button>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}