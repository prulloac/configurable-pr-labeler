export class ConditionalLabel {
  name!: string
  description: string | undefined
  color?: string
  conditions?: any[]
}

export type RepoLabel = {
  name: string
  color?: string
  description: string | undefined
}
