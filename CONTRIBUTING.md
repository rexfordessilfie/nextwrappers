# Contributing
Thank you for considering contributing to this project! Below are is some guidance for how to contribute to this project.

# Issues and Bugs
Experiencing any bugs or issues with this project?
1. Search for the issue you are facing to see if it exists
2. If one doesn't exist, create one with a descriptive name, and fill in the details of the issue you are facing
3. Provide enough information to reproduce the bug you are facing: e.g what version of the library you are on, the version of Next.js you are on, and more.

# Development
Follow the following steps to get started with contributing code to this project:
1. Fork this repository
2. Clone the repository to your computer: `git clone https://github.com/{your-username}/next-route-handler-wrappers.git`
3. Run `yarn install` to install all project dependencies
4. Create a branch for the changes you would like to make, giving it a meaningful name (e.g `add-response-types`, `fix-response-types`, etc.)

## Pull Requests
Pull Requests are how your newly added code can get merged into the main project code! Once your changes are ready:
1. Open a pull request from a branch in your fork to the project's `main` branch. 
2. Give your PR a name describing your overall contribution.
3. In your PR description capture things such as (motivation, changes being made, instructions for testing, a demo if possible etc.), and mention/link related issues.
4. Finally double-check that your code changes are well-tested, following the instructions below.
5. Also check that any documentation updates are made to reflect your changes if necessary!

## Testing
This project uses [ava](https://github.com/avajs/ava) for testing. Some good testing tips to follow are:
1. Add tests for the changes/fixes being introduced by your PR
2. Ensure that all tests are passing by running `yarn test`
3. Ensure that the project still builds with `yarn build`

## Documenttation
If your PR introduces any breaking changes (e.g changes in API), kindly update the documentation to reflect this on your PR's branch. 
All documentation for the library currently lives in the project's `README.md`.

# Deployment
Once changes have been accepted, they will be tagged for a version of the project, merged into main, and then deployed in a subsequent release.

