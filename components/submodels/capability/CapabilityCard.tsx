import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ParsedCapability, CapabilityRole } from '@/lib/types/capability'
import { PropertyValueRenderer } from './PropertyValueRenderer'

function CapabilityRoleBadge({ role }: { role: CapabilityRole }) {
  const variant = role === 'Offered' ? 'default' : role === 'Required' ? 'destructive' : 'secondary'
  return <Badge variant={variant}>{role}</Badge>
}

function CapabilityPropertySet({ properties }: { properties: ParsedCapability['properties'] }) {
  if (properties.length === 0) return null
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Properties</h4>
      <div className="grid gap-2">
        {properties.map((prop) => (
          <div key={prop.idShort} className="flex items-start justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{prop.propertyIdShort}</span>
            <PropertyValueRenderer data={prop.data} />
          </div>
        ))}
      </div>
    </div>
  )
}

interface CapabilityCardProps {
  capability: ParsedCapability
}

export function CapabilityCard({ capability }: CapabilityCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{capability.containerIdShort}</CardTitle>
          <CapabilityRoleBadge role={capability.role} />
        </div>
        {capability.comment && (
          <CardDescription>{capability.comment}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <CapabilityPropertySet properties={capability.properties} />
        {capability.constraints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Constraints</h4>
            <div className="grid gap-1">
              {capability.constraints.map((c) => (
                <div key={c.idShort} className="text-sm">
                  <span className="text-muted-foreground">{c.idShort}</span>
                  {c.value && <span className="ml-2">{c.value}</span>}
                  {c.conditionalType && (
                    <Badge variant="outline" className="ml-2">{c.conditionalType}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
