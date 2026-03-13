import { Badge } from '@/components/ui/badge'
import type { ParsedPropertyValue } from '@/lib/types/capability'

interface PropertyValueRendererProps {
  data: ParsedPropertyValue
}

export function PropertyValueRenderer({ data }: PropertyValueRendererProps) {
  if (data.type === 'range') {
    const min = data.min ?? '?'
    const max = data.max ?? '?'
    return <span>{min} → {max}</span>
  }

  if (data.type === 'list') {
    if (!data.items || data.items.length === 0) return null
    return (
      <span className="flex flex-wrap gap-1">
        {data.items.map((item, idx) => (
          <Badge key={idx} variant="secondary">
            {item}
          </Badge>
        ))}
      </span>
    )
  }

  // single
  if (data.value === 'true' || data.value === 'false') {
    return (
      <Badge variant={data.value === 'true' ? 'default' : 'secondary'}>
        {data.value}
      </Badge>
    )
  }

  return <span>{data.value ?? ''}</span>
}
