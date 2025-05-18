'use client'

import * as React from 'react'
import ActualNextThemes from 'next-themes' // Assuming next-themes default exports an object
import { type ThemeProviderProps } from 'next-themes' // Assuming type is still a named export

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Assuming the actual provider component is a property on the default export
  const ProviderComponent = ActualNextThemes.ThemeProvider
  return <ProviderComponent {...props}>{children}</ProviderComponent>
}
