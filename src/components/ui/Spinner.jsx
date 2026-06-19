/**
 * Componente Spinner - Indicador de carregamento reutilizável
 * 
 * @param {string} size - Tamanho do spinner: 'sm', 'md', 'lg'
 * @param {string} className - Classes CSS adicionais
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3'
  }

  return (
    <div 
      className={`animate-spin border-blue-500 border-t-transparent rounded-full ${sizes[size]} ${className}`}
      role="status"
      aria-label="Carregando"
    />
  )
}

// Made with Bob
