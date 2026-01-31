export interface Component {
  id: string
  name: string
  description?: string
  code: string
  preview?: string
  section?: string
  metadata?: ComponentMetadata
  createdAt: Date | string
  updatedAt: Date | string
  projectId: string
  iterations?: Iteration[]
}

export interface ComponentMetadata {
  props?: ComponentProp[]
  dependencies?: string[]
  tailwindClasses?: string[]
}

export interface ComponentProp {
  name: string
  type: string
  required: boolean
  defaultValue?: string
  description?: string
}

export interface Iteration {
  id: string
  prompt: string
  code: string
  version: number
  createdAt: Date | string
  componentId: string
}

export interface CreateComponentInput {
  name: string
  description?: string
  code: string
  section?: string
  projectId: string
}

export interface RefineComponentInput {
  code: string
  instruction: string
  componentName?: string
}