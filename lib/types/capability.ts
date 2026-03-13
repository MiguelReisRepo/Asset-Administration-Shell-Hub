export type CapabilityRole = 'Offered' | 'Required' | 'NotAssigned'

export interface ParsedPropertyValue {
  type: 'single' | 'range' | 'list'
  value?: string
  valueType?: string
  min?: string
  max?: string
  items?: string[]
}

export interface ParsedPropertyContainer {
  idShort: string
  propertyIdShort: string
  data: ParsedPropertyValue
  supplementalSemanticId?: string
}

export interface ParsedCapabilityConstraint {
  idShort: string
  constraintType: 'BasicConstraint' | 'CustomConstraint' | 'OCLConstraint' | 'OperationConstraint'
  value?: string
  conditionalType?: string
}

export interface ParsedCapability {
  containerIdShort: string
  capabilityIdShort: string
  role: CapabilityRole
  comment?: string
  properties: ParsedPropertyContainer[]
  constraints: ParsedCapabilityConstraint[]
  supplementalSemanticId?: string
}

export interface ParsedCapabilitySubmodel {
  submodelId: string
  capabilities: ParsedCapability[]
}
