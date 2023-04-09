export interface Label {
  name: string
  description: string
  color: string
}

export interface LogicalLabel extends Label {
  type: LabelType
  condition: string
}

export interface Input {
  token: string
  useSizeLabels: boolean
  useBodyMetadataLabels: boolean
  sizeLabels: string
  bodyMetadataLabels: string
}

export enum LabelType {
  SIZE,
  REGEX
}
