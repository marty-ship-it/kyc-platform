'use client'

import { createContext, useContext } from 'react'
import { brandTokens, cnBrand } from './brand-tokens'

interface ThemeContextType {
  theme: 'dark' | 'light'
  tokens: typeof brandTokens
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  tokens: brandTokens,
})

export const useTheme = () => useContext(ThemeContext)

export { brandTokens, cnBrand }