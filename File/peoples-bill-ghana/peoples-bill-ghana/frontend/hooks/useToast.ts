export const useToast = () => {
  return {
    toast: (props: {
      title: string
      description?: string
      variant?: 'default' | 'success' | 'destructive'
    }) => {
      // Simple console implementation for now
      // In production, this would integrate with your toast library
      console.log(`[Toast] ${props.variant || 'default'}: ${props.title}`, props.description)
    },
  }
}
