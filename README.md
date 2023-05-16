# Configurable Pull Request Labeler

![GitHub package.json version](https://img.shields.io/github/package-json/v/prulloac/pr-labeler)
![GitHub contributors](https://img.shields.io/github/contributors/prulloac/pr-labeler)
![GitHub Sponsors](https://img.shields.io/github/sponsors/prulloac)

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/f16c082fc1e84aacb24a89a1d2b8a17e)](https://app.codacy.com/gh/prulloac/pr-labeler/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=prulloac_pr-labeler&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=prulloac_pr-labeler)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=prulloac_pr-labeler&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=prulloac_pr-labeler)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=prulloac_pr-labeler&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=prulloac_pr-labeler)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=prulloac_pr-labeler&metric=coverage)](https://sonarcloud.io/summary/new_code?id=prulloac_pr-labeler)

A GitHub Action that automatically applies labels to your PRs based on a set of configurable rules that may include PR title, body, amount of lines changed, amount of files affected, mergeability and rebaseability.

## Usage

Add `.github/workflows/pr-labeler.yml` as follows:

```yaml
name: 'PR Labeler'
on: # rebuild any PRs and main branch changes
  pull_request:
    types:
      [opened, reopened, edited, synchronize]
    branches:
      - main
      - 'release/**'

jobs:
  label: # name of the job. Jobs run in parallel unless specified otherwise.
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: prulloac/configurable-pr-labeler@v1
        with:
          token: ${{secrets.GITHUB_TOKEN}}

```

## Configuration

This action needs to be configured by creating a `labels.yml` file such as:

```yaml
labels:
  - name: "simple"
    conditions:
      - maxLines: 200
  - name: "normal"
    conditions:
      - minLines: 200
      - maxLines: 1000
  - name: "complex"
    conditions:
      - minLines: 1000
      - maxLines: 5000
  - name: "headache"
    conditions:
      - minLines: 5000
  - name: "important"
    conditions:
      - title: "/^hotfix\\/[a-z0-9\\-_ &#$@!?%]+$/i"
      - minLines: 500
  - name: "important"
    conditions:
      - body: "/#important/gmi"
  - name: "wip"
    conditions:
      - body: "/#(wip|work in progress|work_in_progress|work-in-progress)/gmi"
  - name: "feature"
    conditions:
      - title: "/^feat(ure)?(\\/|:)[a-z0-9\\-_ &#$@!?%]+$/i"
  - name: "feature"
    conditions:
      - branch: "/^feat(ure)?(\\/|:)[a-z0-9\\-_ &#$@!?%]+$/i"
  - name: "fix"
    conditions:
      - title: "/^fix(\\/|:)[a-z0-9\\-_ &#$@!?%]+$/i"
  - name: "fix"
    conditions:
      - branch: "/^fix(\\/|:)[a-z0-9\\-_ &#$@!?%]+$/i"
  - name: "hotfix"
    conditions:
      - title: "/^hotfix(\\/|:)[a-z0-9\\-_ &#$@!?%]+$/i"
  - name: "hotfix"
    conditions:
      - branch: "/^hotfix(\\/|:)[a-z0-9\\-_ &#$@!?%]+$/i"
  - name: "poc"
    conditions:
      - title: "/^(poc|test)(\\/|:)[a-z0-9\\-_ &#$@!?%]+$/i"
  - name: "poc"
    conditions:
      - branch: "/^(poc|test)(\\/|:)[a-z0-9\\-_ &#$@!?%]+$/i"
  - name: "small"
    conditions:
      - maxFiles: 10
  - name: "medium"
    conditions:
      - minFiles: 10
      - maxFiles: 25
  - name: "large"
    conditions:
      - minFiles: 25
      - maxFiles: 50
  - name: "titanic"
    conditions:
      - minFiles: 50
  - name: "JS/TS"
    conditions:
      - files: ["**/*.js", "**/*.ts"]
  - name: "Ready!"
    conditions:
      - mergeable: true
```
