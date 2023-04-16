export type Condition = {
  [key: string]: string | number | boolean
}

export type CompositeCondition = {
  and: Condition[]
}

export class ConditionalLabel {
  name!: string
  description?: string
  color?: string
  conditions?: (Condition | CompositeCondition)[]
}

export type RepoLabel = {
  name: string
  color?: string
  description?: string
}
