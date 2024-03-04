# Open Chatter

Open Chatter is an application-based alternative to other front-end Large Language Model websites and projects.

This project is mainly made for fun. The goal is to have an application for AI roleplaying.

This is a barebones project at the moment. Expect bugs and incomplete features.

## Models

Currently, this project does not manage the models itself, it relies on a 3rd party (llama.cpp for now) to run the model.

## Usage

To run a development environment, run

`npm run electron:start`

To build the project, run one of these, depending on the target platform (only Windows has been tested for now)

`npm run electron:package:mac`

`npm run electron:package:linux`

`npm run electron:package:win`
