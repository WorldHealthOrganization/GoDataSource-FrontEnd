# Go.Data - Front End application

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.7, using Angular v7.2.11.

## Installation (Development Environment)

### Pre-Requisites

Install latest LTS versions of Node.js v10.x and compatible npm on your machine (https://nodejs.org/download/).

- Current Node.js version for development: 10.x
- Current npm version for development: 6.4.1

Install git on your machine
- For Ubuntu:

   ```
   sudo apt-get update
   sudo apt-get install git
   ```

### Installation steps

Get the code from GitHub

    git clone https://bitbucket.org/clarisoft-technologies/go.data-front-end.git

Install 3rd-party packages

    npm install

### Running with dev environment

Configure the application for dev environment

    cp src/environments/environment.ts.default src/environments/environment.ts

Update src/environments/environment.ts as necessary  

Run the application (it will start on port 4550; you can change this from the package.json file)

    npm start

Open your browser on: http://localhost:4550

### Running with production environment

Configure the application for production environment

    cp src/environments/environment.ts.default src/environments/environment.prod.ts

Update src/environments/environment.prod.ts as necessary  

Create the production build

    npm run build

Note: If you get an error related to memory usage, create the production build as following

    npm run build-high-memory

This build will be served by the API. Check API documentation to get the path where the frontend build should be placed. 

## Development

Use the IDE of your choice (Webstorm recommended).

### Development cycle

1. Nobody can directly PUSH into master
2. Every code change will be done in a separate branch and a Pull Request (PR) will be created for merging the code into master
    - Create a new branch from latest version of master. Use the OTPM/Jira activity ID for branch name (e.g. "```385484```")
        - If the branch was already created by somebody else, append your initials to the OPTM activity ID (e.g. "```385484-mi```")
    - Push the changes into the branch daily
    - When the work is ready to be merged in master create a Pull Request (PR) from your branch
        - The PR title must contain the OTPM/Jira activity ID and title (e.g. "```385484: Research & Preparing the project```")
        - The PR description must include a summary of the changes, the affected areas and other additional noted if necessary
3. Every PR needs to be reviewed by another dev in order to be merged in master
    - Review comments are added inline, on PR's page in GitHub UI
    - If the changes are good to be merged in master, the Reviewer will Approve the PR and then merge it in master
    - If the PR requires any changes, the Reviewer will add the comments and will inform the dev when the code review is finished
        - Dev must address all the comments in his PR, fix the code where necessary and REPLY to all comments, so the Reviewer knows that none of the comments were missed
4. Before assigning the ticket to QA, the developer must close the branch(es) that were merged and are not needed anymore.

### Managing Language Translations

1. Go.Data supports multiple languages, the base language being English-US.
2. In development, we are adding support only for the English-US language.
3. We must NOT have hardcoded strings in our application. All the strings that are being displayed in the UI must be translated.
4. All the translations (aka Language Tokens) are stored in the API, and can be seen here: https://github.com/ClarisoftTechnologies/Go.Data-API/blob/master/server/install/scripts/migrations/older/data/languages/english_us.json
5. For development purpose only, FrontEnd developers can add new Language Tokens in "**/src/app/i18n/english_us.ts**" file, so that the changes are reflected in the UI while developing.
   - Note that the Language Tokens in previously mentioned file (english_us.ts) are overriding the values defined in the API.
6. From time to time, we are cleaning up the "english_us.ts" file, moving all the tokens in the API code.
7. **Before defining new Language Tokens in "english_us.ts" file, verify that there isn't already existing a similar token in the API language file (see item #4 from above), and that you are following the pattern.**. 
   - Note that all the Language Tokens are grouped based on some criterias (scope, page).
8. If you want to remove a Language Token that is not being used (anymore), just add a comment in "english_us.ts" and it will be taken into account when merging the file with the API translations (see item #6 from above).

### Known issues

___
## Copyright
Copyright The GoDataSource-FrontEnd Contributors.

## Terms of Use and License Agreement
GoDataSource-FrontEnd is available under the [GNU General Public License Version 3](LICENSE).

GoDataSource-FrontEnd also includes external libraries that are available under a variety of licenses.

## Disclaimer of Warranty
There is no warranty for the program, to the extent permitted by applicable law. Except when otherwise stated in writing the copyright holders and/or other parties provide the program “as is” without warranty of any kind, either expressed or implied, including, but not limited to, the implied warranties of merchantability and fitness for a particular purpose. The entire risk as to the quality and performance of the program is with you. should the program prove defective, you assume the cost of all necessary servicing, repair or correction.

## Limitation of Liability
In no event unless required by applicable law or agreed to in writing will any copyright holder, or any other party who modifies and/or conveys the program as permitted in the license, be liable to you for damages, including any general, special, incidental or consequential damages arising out of the use or inability to use the program (including but not limited to loss of data or data being rendered inaccurate or losses sustained by you or third parties or a failure of the program to operate with any other programs), even if such holder or other party has been advised of the possibility of such damages.
