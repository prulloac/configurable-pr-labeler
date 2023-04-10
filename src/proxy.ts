import {getInput, getBooleanInput} from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {Input} from './types'

export const input: Input = {
  token: getInput('token', {required: true}),
  useComplexityLabels: getBooleanInput('useComplexityLabels', {
    required: false
  }),
  useSizeLabels: getBooleanInput('useSizeLabels', {required: false}),
  useBodyMetadataLabels: getBooleanInput('useBodyMetadataLabels', {
    required: false
  }),
  useTitleMetadataLabels: getBooleanInput('useBodyMetadataLabels', {
    required: false
  }),
  complexityLabels: getInput('complexityLabels', {required: false}),
  sizeLabels: getInput('sizeLabels', {required: false}),
  bodyMetadataLabels: getInput('bodyMetadataLabels', {required: false}),
  titleMetadataLabels: getInput('titleMetadataLabels', {required: false})
}

export const client = getOctokit(input.token)

export const prNumber: number = context.payload.pull_request?.number || 0
