# Go.Data - Front End application

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.4, using Angular v5.2.

## Installation (Development Environment)

### Pre-Requisites
    
Install latest LTS versions of Node.js and npm on your machine (https://nodejs.org/download/).

- Current Node.js version for development: 8.12.0
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
  
