export interface Condition {
  [key: string]: string
}

export class ConditionalLabel {
  name!: string
  description: string | undefined
  color?: string
  conditions!: Condition[]
}

export type RepoLabel = {
  name: string
  color?: string
  description: string | undefined
}
