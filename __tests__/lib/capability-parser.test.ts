import { DOMParser } from '@xmldom/xmldom'
import {
  isCapabilitySubmodel,
  parseCapabilitySubmodel,
} from '@/lib/parsers/capability-parser'

const AAS_NS = 'https://admin-shell.io/aas/3/0'
const CAP_SET_SEM_ID = 'https://admin-shell.io/idta/CapabilityDescription/CapabilitySet/1/0'
const CAP_SET_SEMANTIC_XML = `<semanticId><keys><key><type>GlobalReference</type><value>${CAP_SET_SEM_ID}</value></key></keys></semanticId>`

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, 'text/xml')
}

function getRoot(xml: string): Element {
  return parseXml(xml).documentElement
}

describe('isCapabilitySubmodel', () => {
  it('returns true for a CapabilityDescription submodel', () => {
    const xml = `
      <submodel xmlns="${AAS_NS}">
        <semanticId>
          <keys>
            <key>
              <type>GlobalReference</type>
              <value>https://admin-shell.io/idta/CapabilityDescription/1/0/Submodel</value>
            </key>
          </keys>
        </semanticId>
      </submodel>
    `
    expect(isCapabilitySubmodel(getRoot(xml))).toBe(true)
  })

  it('returns false for a Nameplate submodel', () => {
    const xml = `
      <submodel xmlns="${AAS_NS}">
        <semanticId>
          <keys>
            <key>
              <type>GlobalReference</type>
              <value>https://admin-shell.io/zvei/nameplate/2/0/Nameplate</value>
            </key>
          </keys>
        </semanticId>
      </submodel>
    `
    expect(isCapabilitySubmodel(getRoot(xml))).toBe(false)
  })

  it('returns false for a similar but non-matching semantic ID', () => {
    const xml = `
      <submodel xmlns="${AAS_NS}">
        <semanticId>
          <keys>
            <key>
              <type>GlobalReference</type>
              <value>https://admin-shell.io/idta/CapabilityDescription/1/0/SubmodelTemplate</value>
            </key>
          </keys>
        </semanticId>
      </submodel>
    `
    expect(isCapabilitySubmodel(getRoot(xml))).toBe(false)
  })

  it('returns false for a submodel with no semanticId', () => {
    const xml = `
      <submodel xmlns="${AAS_NS}">
        <idShort>EmptySubmodel</idShort>
      </submodel>
    `
    expect(isCapabilitySubmodel(getRoot(xml))).toBe(false)
  })
})

describe('parseCapabilitySubmodel', () => {
  const FIXTURE_XML = `
    <submodel xmlns="${AAS_NS}">
      <id>urn:example:sm:CapabilityDescription:1</id>
      <semanticId>
        <keys>
          <key>
            <type>GlobalReference</type>
            <value>https://admin-shell.io/idta/CapabilityDescription/1/0/Submodel</value>
          </key>
        </keys>
      </semanticId>
      <submodelElements>
        <submodelElementCollection>
          <idShort>CapabilitySet</idShort>
            ${CAP_SET_SEMANTIC_XML}
          <value>
            <submodelElementCollection>
              <idShort>WeldingProcess</idShort>
              <value>
                <capability>
                  <idShort>WeldingProcess</idShort>
                  <qualifiers>
                    <qualifier>
                      <semanticId>
                        <keys>
                          <key>
                            <type>GlobalReference</type>
                            <value>https://admin-shell.io/idta/CapabilityDescription/1/0/CapabilityRoleQualifier/Required</value>
                          </key>
                        </keys>
                      </semanticId>
                      <value>false</value>
                    </qualifier>
                    <qualifier>
                      <semanticId>
                        <keys>
                          <key>
                            <type>GlobalReference</type>
                            <value>https://admin-shell.io/idta/CapabilityDescription/1/0/CapabilityRoleQualifier/Offered</value>
                          </key>
                        </keys>
                      </semanticId>
                      <value>true</value>
                    </qualifier>
                    <qualifier>
                      <semanticId>
                        <keys>
                          <key>
                            <type>GlobalReference</type>
                            <value>https://admin-shell.io/idta/CapabilityDescription/1/0/CapabilityRoleQualifier/NotAssigned</value>
                          </key>
                        </keys>
                      </semanticId>
                      <value>false</value>
                    </qualifier>
                  </qualifiers>
                </capability>
                <multiLanguageProperty>
                  <idShort>CapabilityComment</idShort>
                  <value>
                    <langStringTextType>
                      <language>en</language>
                      <text>Advanced welding capability</text>
                    </langStringTextType>
                  </value>
                </multiLanguageProperty>
                <submodelElementCollection>
                  <idShort>PropertySet</idShort>
                  <value>
                    <submodelElementCollection>
                      <idShort>PowerRangeContainer</idShort>
                      <value>
                        <range>
                          <idShort>PowerRange</idShort>
                          <valueType>xs:double</valueType>
                          <min>100</min>
                          <max>5000</max>
                        </range>
                      </value>
                    </submodelElementCollection>
                    <submodelElementCollection>
                      <idShort>MaterialGroupContainer</idShort>
                      <value>
                        <submodelElementList>
                          <idShort>MaterialGroup</idShort>
                          <value>
                            <property>
                              <idShort></idShort>
                              <value>Steel</value>
                            </property>
                            <property>
                              <idShort></idShort>
                              <value>Aluminium</value>
                            </property>
                          </value>
                        </submodelElementList>
                      </value>
                    </submodelElementCollection>
                    <submodelElementCollection>
                      <idShort>ContinuousWaveContainer</idShort>
                      <value>
                        <property>
                          <idShort>ContinuousWave</idShort>
                          <valueType>xs:boolean</valueType>
                          <value>true</value>
                        </property>
                      </value>
                    </submodelElementCollection>
                  </value>
                </submodelElementCollection>
              </value>
            </submodelElementCollection>
          </value>
        </submodelElementCollection>
      </submodelElements>
    </submodel>
  `

  let result: ReturnType<typeof parseCapabilitySubmodel>

  beforeAll(() => {
    result = parseCapabilitySubmodel(getRoot(FIXTURE_XML))
  })

  it('extracts the submodel id', () => {
    expect(result.submodelId).toBe('urn:example:sm:CapabilityDescription:1')
  })

  it('parses exactly one capability', () => {
    expect(result.capabilities).toHaveLength(1)
  })

  it('detects the Offered role from qualifiers', () => {
    expect(result.capabilities[0].role).toBe('Offered')
  })

  it('extracts the capability comment', () => {
    expect(result.capabilities[0].comment).toBe('Advanced welding capability')
  })

  it('parses 3 property containers', () => {
    expect(result.capabilities[0].properties).toHaveLength(3)
  })

  it('parses the range property correctly', () => {
    const rangeProp = result.capabilities[0].properties.find(
      (p) => p.idShort === 'PowerRangeContainer'
    )
    expect(rangeProp).toBeDefined()
    expect(rangeProp!.propertyIdShort).toBe('PowerRange')
    expect(rangeProp!.data.type).toBe('range')
    expect(rangeProp!.data.min).toBe('100')
    expect(rangeProp!.data.max).toBe('5000')
  })

  it('parses the list property correctly', () => {
    const listProp = result.capabilities[0].properties.find(
      (p) => p.idShort === 'MaterialGroupContainer'
    )
    expect(listProp).toBeDefined()
    expect(listProp!.propertyIdShort).toBe('MaterialGroup')
    expect(listProp!.data.type).toBe('list')
    expect(listProp!.data.items).toEqual(['Steel', 'Aluminium'])
  })

  it('parses the single boolean property correctly', () => {
    const singleProp = result.capabilities[0].properties.find(
      (p) => p.idShort === 'ContinuousWaveContainer'
    )
    expect(singleProp).toBeDefined()
    expect(singleProp!.propertyIdShort).toBe('ContinuousWave')
    expect(singleProp!.data.type).toBe('single')
    expect(singleProp!.data.value).toBe('true')
  })
})

describe('parseCapabilitySubmodel — multiple CapabilitySets', () => {
  it('collects capabilities from all CapabilitySets', () => {
    const xml = `
      <submodel xmlns="${AAS_NS}">
        <id>urn:example:sm:multi</id>
        <submodelElements>
          <submodelElementCollection>
            <idShort>CapabilitySet</idShort>
            ${CAP_SET_SEMANTIC_XML}
            <value>
              <submodelElementCollection>
                <idShort>Cap1</idShort>
                <value>
                  <capability><idShort>Cap1</idShort></capability>
                </value>
              </submodelElementCollection>
            </value>
          </submodelElementCollection>
          <submodelElementCollection>
            <idShort>CapabilitySet</idShort>
            ${CAP_SET_SEMANTIC_XML}
            <value>
              <submodelElementCollection>
                <idShort>Cap2</idShort>
                <value>
                  <capability><idShort>Cap2</idShort></capability>
                </value>
              </submodelElementCollection>
            </value>
          </submodelElementCollection>
        </submodelElements>
      </submodel>
    `
    const result = parseCapabilitySubmodel(getRoot(xml))
    expect(result.capabilities).toHaveLength(2)
    expect(result.capabilities[0].containerIdShort).toBe('Cap1')
    expect(result.capabilities[1].containerIdShort).toBe('Cap2')
  })
})

describe('parseCapabilitySubmodel — ConstraintHasProperty', () => {
  it('resolves constrainedPropertyIdShort from ConstraintHasProperty second element', () => {
    const xml = `
      <submodel xmlns="${AAS_NS}">
        <id>urn:example:sm:constraints</id>
        <submodelElements>
          <submodelElementCollection>
            <idShort>CapabilitySet</idShort>
            ${CAP_SET_SEMANTIC_XML}
            <value>
              <submodelElementCollection>
                <idShort>WeldingProcess</idShort>
                <value>
                  <capability><idShort>WeldingProcess</idShort></capability>
                  <submodelElementCollection>
                    <idShort>CapabilityRelations</idShort>
                    <value>
                      <submodelElementCollection>
                        <idShort>ConstraintSet</idShort>
                        <value>
                          <submodelElementCollection>
                            <idShort>PowerConstraint</idShort>
                            <value>
                              <property>
                                <idShort>ConstraintType</idShort>
                                <value>BasicConstraint</value>
                              </property>
                              <property>
                                <idShort>BasicConstraint</idShort>
                                <value>PowerRange &gt; 500</value>
                              </property>
                              <submodelElementCollection>
                                <idShort>ConstraintPropertyRelations</idShort>
                                <value>
                                  <relationshipElement>
                                    <idShort>ConstraintHasProperty</idShort>
                                    <first>
                                      <keys>
                                        <key>
                                          <type>Property</type>
                                          <value>PowerConstraint</value>
                                        </key>
                                      </keys>
                                    </first>
                                    <second>
                                      <keys>
                                        <key>
                                          <type>Property</type>
                                          <value>PowerRange</value>
                                        </key>
                                      </keys>
                                    </second>
                                  </relationshipElement>
                                </value>
                              </submodelElementCollection>
                            </value>
                          </submodelElementCollection>
                        </value>
                      </submodelElementCollection>
                    </value>
                  </submodelElementCollection>
                </value>
              </submodelElementCollection>
            </value>
          </submodelElementCollection>
        </submodelElements>
      </submodel>
    `
    const result = parseCapabilitySubmodel(getRoot(xml))
    expect(result.capabilities).toHaveLength(1)
    expect(result.capabilities[0].constraints).toHaveLength(1)
    const constraint = result.capabilities[0].constraints[0]
    expect(constraint.idShort).toBe('PowerConstraint')
    expect(constraint.constraintType).toBe('BasicConstraint')
    expect(constraint.value).toBe('PowerRange > 500')
    expect(constraint.constrainedPropertyIdShort).toBe('PowerRange')
  })
})

describe('parseCapabilitySubmodel edge cases', () => {
  it('returns 0 capabilities for an empty CapabilitySet', () => {
    const xml = `
      <submodel xmlns="${AAS_NS}">
        <id>urn:example:sm:empty</id>
        <submodelElements>
          <submodelElementCollection>
            <idShort>CapabilitySet</idShort>
            ${CAP_SET_SEMANTIC_XML}
            <value></value>
          </submodelElementCollection>
        </submodelElements>
      </submodel>
    `
    const result = parseCapabilitySubmodel(getRoot(xml))
    expect(result.capabilities).toHaveLength(0)
    expect(result.submodelId).toBe('urn:example:sm:empty')
  })

  it('handles a capability with no PropertySet and detects role correctly', () => {
    const xml = `
      <submodel xmlns="${AAS_NS}">
        <id>urn:example:sm:noprops</id>
        <submodelElements>
          <submodelElementCollection>
            <idShort>CapabilitySet</idShort>
            ${CAP_SET_SEMANTIC_XML}
            <value>
              <submodelElementCollection>
                <idShort>MinimalCapability</idShort>
                <value>
                  <capability>
                    <idShort>MinimalCapability</idShort>
                    <qualifiers>
                      <qualifier>
                        <semanticId>
                          <keys>
                            <key>
                              <type>GlobalReference</type>
                              <value>https://admin-shell.io/idta/CapabilityDescription/1/0/CapabilityRoleQualifier/Required</value>
                            </key>
                          </keys>
                        </semanticId>
                        <value>true</value>
                      </qualifier>
                    </qualifiers>
                  </capability>
                </value>
              </submodelElementCollection>
            </value>
          </submodelElementCollection>
        </submodelElements>
      </submodel>
    `
    const result = parseCapabilitySubmodel(getRoot(xml))
    expect(result.capabilities).toHaveLength(1)
    expect(result.capabilities[0].properties).toHaveLength(0)
    expect(result.capabilities[0].role).toBe('Required')
    expect(result.capabilities[0].containerIdShort).toBe('MinimalCapability')
  })
})
