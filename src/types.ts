import {getOctokit} from '@actions/github'

export type ClientType = ReturnType<typeof getOctokit>

export interface Condition {}

export type ConditionalLabel = {
	name: string
	description?: string
	color?: string
	conditions: Condition[]
}

export type RepoLabel = {
	name: string
	color?: string
	description?: string
}
