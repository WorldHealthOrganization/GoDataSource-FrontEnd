# Go.Data - Front End application

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.7.4, using Angular v5.2.

## Installation (Development Environment)

### Pre-Requisites
    
Install latest LTS versions of Node.js and npm on your machine (https://nodejs.org/download/).

- Current Node.js version for development: 8.11.1
- Current npm version for development: 5.6.0
    
Install git on your machine
- For Ubuntu:

   ```
   sudo apt-get update
   sudo apt-get install git
   ```

Install Angular CLI v1.7.4 on your machine

    sudo npm install -g @angular/cli@1.7.4
    
### Installation steps
    
Get the code from GitHub
    
    git clone https://mihai_ilie@bitbucket.org/clarisoft-technologies/go.data-front-end.git

Install 3rd-party packages
    
    npm install
    
[TODO] Configure the application for dev environment

    cp src/environments/environment.ts.default src/environments/environment.ts
    
[TODO] Update src/environments/environment.ts as necessary  
    	
Run the application (it will start on port 4500; you can change this from package.json file)
    
    npm start
    	
Open your browser on: http://localhost:4500
    
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

## [TODO] Deployment
    
Install __docker__ on the machine
- For Ubuntu:

   ```
   https://docs.docker.com/install/linux/docker-ce/ubuntu/
   ```

Install __docker-compose__ on the machine
- For Ubuntu:

   ```
   https://docs.docker.com/compose/install/
   ```
   
Clone the repository somewhere on the machine

   ```
   git clone https://github.com/ClarisoftTechnologies/PushWebFrontEnd.git
   ```
   
Run the build with the environment that you need
- available environment files are located under _src/environments/*_, and have this format: environment.**build_env**.ts
- examples of environment files:
    - environment.prod.ts (this is the __prod__ environment)
    - environment.prodPush.ts (this is the __prodPush__ environment) 
- run the following command, using the proper environment (depending on the machine where the app will be running):

   ```
   node build/build-docker-image.js [build_env]
   ```

- the bundle will be created under __build/assets/push-app:1.0.0.tar__
- (optional) discard old docker images:

   ```
   docker images
   docker rmi <imageId>
   ```

- load the new image

   ```
   docker load -i build/push-app:1.0.0.tar
   ```
   
- (optional) configure the __docker-compose.yml__ file
- build container and start the application:

   ```
   docker-compose up -d
   ```
