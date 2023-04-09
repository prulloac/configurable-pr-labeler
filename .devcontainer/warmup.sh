#!/bin/bash

pip install pre-commit
npm install -g @devcontainers/cli
git config --global init.defaultBranch $GIT_DEFAULT_BRANCH
git config --global --add --bool push.autoSetupRemote true
git config --global --add safe.directory $(pwd)
echo "Enter your developer email:"
read devEmail
echo "Your developer email was set to: ${devEmail}"
echo "\n...\n"
echo "Enter your name:"
read devName
echo "Your name was set to: ${devName}"
git config --global user.email "${devEmail}"
git config --global user.name "${devName}"
