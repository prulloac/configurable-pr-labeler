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

export interface Label {
  name: string
  description: string
  color: string
}

export enum LabelType {
  SIZE,
  REGEX
}

export interface LogicalLabel extends Label {
  type: LabelType
  condition: string
}
