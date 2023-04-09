#!/bin/bash

pip install pre-commit
npm install -g @devcontainers/cli
git config --global init.defaultBranch $GIT_DEFAULT_BRANCH
git config --global --add --bool push.autoSetupRemote true
git config --global --add safe.directory $(pwd)
if [[ -z "${GIT_USER_EMAIL}" ]]; then
    if [[ -z "$(git config --global --get user.email)" ]]; then
        read -r -p "Enter your developer email: " GIT_USER_EMAIL
        echo "Your developer email was set to: ${GIT_USER_EMAIL}"
    else
        GIT_USER_EMAIL="$(git config --global --get user.email)"
    fi
fi
if [[ -z "${GIT_USER_NAME}" ]]; then
    if [[ -z "$(git config --global --get user.name)" ]]; then
        read -r -p "Enter your name: " GIT_USER_NAME
        echo "Your name was set to: ${GIT_USER_NAME}"
    else
        GIT_USER_NAME="$(git config --global --get user.name)"
    fi
fi
echo "export GIT_USER_EMAIL=${GIT_USER_EMAIL}" >> $HOME/.zshenv
echo "export GIT_USER_NAME=\"${GIT_USER_NAME}\"" >> $HOME/.zshenv
git config --global user.email "${GIT_USER_EMAIL}"
git config --global user.name "${GIT_USER_NAME}"
git init
pre-commit install
cd ./.devcontainer && cat zshrc-ext >> $HOME/.zshrc
sudo chsh -s /bin/zsh
