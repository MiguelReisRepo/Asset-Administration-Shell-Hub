/**
 * Factory functions for creating AAS SubmodelElements.
 * Extracted from aas-editor.tsx for testability and reuse.
 */

export type SubmodelElementModelType =
  | "Property"
  | "MultiLanguageProperty"
  | "SubmodelElementCollection"
  | "SubmodelElementList"
  | "File"
  | "Blob"
  | "Range"
  | "ReferenceElement"
  | "Entity"
  | "Capability"
  | "Operation"
  | "BasicEventElement"
  | "RelationshipElement"
  | "AnnotatedRelationshipElement"

export type ElementType = SubmodelElementModelType | "CapabilityName"

export type Cardinality = "One" | "ZeroToOne" | "ZeroToMany" | "OneToMany"

export interface SubmodelElement {
  idShort: string
  modelType: SubmodelElementModelType
  valueType?: string
  value?: any
  cardinality?: Cardinality
  description?: string
  semanticId?: string | { keys?: { value?: string }[] }
  children?: SubmodelElement[]
  contentType?: string
  entityType?: "CoManagedEntity" | "SelfManagedEntity"
  min?: string
  max?: string
  first?: any
  second?: any
  observed?: any
  inputVariables?: any[]
  outputVariables?: any[]
  inoutputVariables?: any[]
}

export interface CreateElementParams {
  type: ElementType
  idShort: string
  cardinality: Cardinality
  description: string
  semanticId: string
  valueType?: string
  entityType?: "CoManagedEntity" | "SelfManagedEntity"
}

/** The 4 inner elements of a CapabilityName container */
function capabilityInnerChildren(capabilityIdShort: string): SubmodelElement[] {
  return [
    { idShort: capabilityIdShort, modelType: "Capability", cardinality: "One", description: "The capability element" },
    { idShort: "CapabilityComment", modelType: "MultiLanguageProperty", cardinality: "ZeroToOne", description: "Comment about this capability", value: { en: "" } },
    {
      idShort: "PropertySet", modelType: "SubmodelElementCollection", cardinality: "ZeroToMany",
      description: "Set of properties for this capability",
      semanticId: "https://admin-shell.io/idta/CapabilityDescription/1/0/PropertySet", children: [],
    },
    {
      idShort: "CapabilityRelations", modelType: "SubmodelElementCollection", cardinality: "ZeroToOne",
      description: "Relations and constraints",
      semanticId: "https://admin-shell.io/idta/CapabilityDescription/1/0/CapabilityRelations", children: [],
    },
  ]
}

/** Wraps the 4 capability elements inside a CapabilityName SMC */
function capabilityNameContainer(capabilityIdShort: string): SubmodelElement {
  return {
    idShort: "CapabilityName",
    modelType: "SubmodelElementCollection",
    cardinality: "One",
    description: "A named capability container",
    children: capabilityInnerChildren(capabilityIdShort),
  }
}

/**
 * Creates a new SubmodelElement based on the given type and parameters.
 * Handles CapabilitySet and CapabilityContainer pseudo-types.
 */
export function createElement(params: CreateElementParams): SubmodelElement {
  const { type, idShort, cardinality, description, semanticId, valueType, entityType } = params

  // CapabilityName: SMC with 4 default children (to add inside an existing CapabilitySet)
  if (type === "CapabilityName") {
    return {
      idShort: idShort || "CapabilityName",
      modelType: "SubmodelElementCollection",
      cardinality,
      description: description || "A named capability container",
      semanticId: semanticId || undefined,
      children: capabilityInnerChildren("Capability1"),
    }
  }

  const base: SubmodelElement = {
    idShort,
    modelType: type as SubmodelElementModelType,
    cardinality,
    description: description || undefined,
    semanticId: semanticId || undefined,
  }

  switch (type) {
    case "Property":
      return { ...base, valueType: valueType || "string", value: "" }
    case "MultiLanguageProperty":
      return { ...base, value: { en: "" } }
    case "SubmodelElementCollection":
    case "SubmodelElementList":
      return { ...base, children: [] }
    case "File":
      return { ...base, value: "", contentType: "" }
    case "Blob":
      return { ...base, value: "", contentType: "application/octet-stream" }
    case "Range":
      return { ...base, valueType: valueType || "string", min: "", max: "" }
    case "ReferenceElement":
      return { ...base, value: { type: "ModelReference", keys: [] } }
    case "Entity":
      return { ...base, entityType: entityType || "CoManagedEntity", children: [] }
    case "Capability":
      return { ...base }
    case "Operation":
      return { ...base, inputVariables: [], outputVariables: [], inoutputVariables: [] }
    case "BasicEventElement":
      return { ...base, observed: { type: "ModelReference", keys: [] } }
    case "RelationshipElement":
    case "AnnotatedRelationshipElement":
      return { ...base, first: { type: "ModelReference", keys: [] }, second: { type: "ModelReference", keys: [] } }
    default:
      return base
  }
}

/**
 * Generates the default template structure for a CapabilityDescription submodel.
 */
export function generateCapabilityTemplateStructure(): SubmodelElement[] {
  return [
    {
      idShort: "CapabilitySet",
      modelType: "SubmodelElementCollection",
      cardinality: "One",
      description: "Set of capabilities",
      semanticId: "https://admin-shell.io/idta/CapabilityDescription/1/0/CapabilitySet",
      children: [capabilityNameContainer("Capability1")],
    },
  ]
}

/** All available element types for the Add Element dialog */
export const ALL_ELEMENT_TYPES: { value: string; label: string; description: string }[] = [
  { value: "Property", label: "Property", description: "A single value with a data type" },
  { value: "MultiLanguageProperty", label: "Multi-Language Property", description: "A value in multiple languages" },
  { value: "SubmodelElementCollection", label: "Collection (SMC)", description: "A container for child elements" },
  { value: "SubmodelElementList", label: "List (SML)", description: "An ordered list of elements" },
  { value: "File", label: "File", description: "A reference to a file" },
  { value: "Blob", label: "Blob", description: "Binary data stored inline" },
  { value: "Range", label: "Range", description: "A value range with min and max" },
  { value: "ReferenceElement", label: "Reference Element", description: "A reference to another element" },
  { value: "Entity", label: "Entity", description: "An entity with optional asset ID" },
  { value: "Capability", label: "Capability", description: "A capability of the asset" },
  { value: "CapabilityName", label: "Capability Name", description: "IDTA CapabilityName with Capability, Comment, PropertySet & Relations" },
  { value: "Operation", label: "Operation", description: "An operation with inputs/outputs" },
  { value: "BasicEventElement", label: "Basic Event Element", description: "An event element" },
  { value: "RelationshipElement", label: "Relationship Element", description: "A relationship between two elements" },
  { value: "AnnotatedRelationshipElement", label: "Annotated Relationship", description: "A relationship with annotations" },
]
