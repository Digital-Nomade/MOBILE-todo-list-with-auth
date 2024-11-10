import { useEffect, useState } from 'react'

export function useDebouncer(value: string, miliSeconds: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, miliSeconds)

    return () => clearTimeout(timer)
  }, [value, miliSeconds])

  return debouncedValue
}
