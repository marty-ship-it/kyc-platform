import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Demo users for the deployed version
const users = [
  {
    id: '1',
    email: 'sarah@coastalrealty.com',
    password: 'Password123!',
    name: 'Sarah Mitchell',
    role: 'DIRECTOR'
  },
  {
    id: '2', 
    email: 'luca@coastalrealty.com',
    password: 'Password123!',
    name: 'Luca Romano',
    role: 'AGENT'
  },
  {
    id: '3',
    email: 'priya@coastalrealty.com', 
    password: 'Password123!',
    name: 'Priya Sharma',
    role: 'COMPLIANCE_OFFICER'
  }
]

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check against demo users
        const user = users.find(user => 
          user.email === credentials.email && 
          user.password === credentials.password
        )

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'demo-secret-key-for-kycira-platform'
}

export default NextAuth(authOptions)