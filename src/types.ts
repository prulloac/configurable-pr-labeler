import {info} from '@actions/core'

export interface Input {
  token: string
  useComplexityLabels: boolean
  useSizeLabels: boolean
  useBodyMetadataLabels: boolean
  useTitleMetadataLabels: boolean
  complexityLabels: string
  sizeLabels: string
  bodyMetadataLabels: string
  titleMetadataLabels: string
}

export class Label {
  name: string
  description: string | null
  color: string

  constructor(name: string, color: string, description: string | null) {
    this.name = name.trim()
    this.color = color.trim()
    this.description = description?.trim() || null
  }

  log() {
    info(`label: ${this.name}, color: ${this.color}`)
  }
}

export enum LabelType {
  SIZE,
  REGEX
}

export class LogicalLabel extends Label {
  type: LabelType | undefined
  condition: string

  constructor(
    name: string,
    color: string,
    description: string | null,
    condition: string,
    type?: LabelType
  ) {
    super(name, color, description)
    this.type = type
    this.condition = condition
  }

  log() {
    info(
      `label: ${this.name}, color: ${this.color}, condition: ${this.condition}`
    )
  }
}
