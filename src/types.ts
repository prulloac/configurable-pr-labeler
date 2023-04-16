import {getOctokit} from '@actions/github'

export type ClientType = ReturnType<typeof getOctokit>

export interface Condition {}

class MaxLinesCondition implements Condition {
	maxLines!: number
}

class MinLinesCondition implements Condition {
	minLines!: number
}

class MaxFilesCondition implements Condition {
	maxFiles!: number
}

class MinFilesCondition implements Condition {
	minFiles!: number
}

class BodyCondition implements Condition {
	body!: string
}

class TitleCondition implements Condition {
	title!: string
}

class FilePathCondition implements Condition {
	path!: string[]
}

class MergeableCondition implements Condition {
	mergeable!: boolean
}

class RebaseableCondition implements Condition {
	rebaseable!: boolean
}

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

export const Conditions = {
	MaxFilesCondition,
	MinFilesCondition,
	MaxLinesCondition,
	MinLinesCondition,
	TitleCondition,
	BodyCondition,
	FilePathCondition,
	MergeableCondition,
	RebaseableCondition
}
