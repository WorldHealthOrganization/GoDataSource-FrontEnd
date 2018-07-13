**A. Creating spring branches & building the distribution files:**
1. For CD branch you need to use the master branch to build the distribution files
    - git checkout master
    - git pull ( make sure we have the latest master code )
    - update environment files if necessary to point to the proper who api ( e.g http://whoapicd.clarisoft.com/api )
        - files to update
            - src/environments/environment.prod.ts ( main one for distribution )
            - src/environments/environment.ts
            - src/environments/environment.ts.default
        - if you changed something, then we need to push changes
            - git add <files>
            - git commit -m message
            - git push
    - rm -r dist ( remove distribution files, this isn't really necessary, but... )
    - npm run build ( build distribution files )
2. For sprint branches ( s1, s2, ... sn ) you either need to create a new branch if it doesn't exist or you need to update the existing one
    - create:
        - git checkout master
        - git pull
        - git checkout -b sX
        - update environment files to point to the proper who api ( e.g http://whoapiX.clarisoft.com/api )
            - files to update
                - src/environments/environment.prod.ts ( main one for distribution )
                - src/environments/environment.ts
                - src/environments/environment.ts.default
            - push changes
                - git add <files>
                - git commit -m message
                - git push --set-upstream origin sX
        - rm -r dist ( remove distribution files, this isn't really necessary, but... )
        - npm run build ( build distribution files )
    - update 
        - git checkout master
        - git pull
        - git checkout sX
        - git pull origin master
        - fix conflicts if any
        - update environment files if necessary to point to the proper who api ( e.g http://whoapiX.clarisoft.com/api )
            - files to update
                - src/environments/environment.prod.ts ( main one for distribution )
                - src/environments/environment.ts
                - src/environments/environment.ts.default
        - push changes
            - git add <files>
            - git commit -m message
            - git push sX
        - rm -r dist ( remove distribution files, this isn't really necessary, but... )
        - npm run build ( build distribution files )

**B. Deploying distribution:**
    On the previous step ( A ) we created the distribution files by running "npm run build".
    To easily copy the distribution files to our server, we should make an archive.
    - remove previous zip files ( optional )
        - rm cd.zip
        - rm sX.zip
    - zip files
        - CD branch
            - zip -r cd.zip dist
        - sprint sX branches 
            - zip -r sX.zip dist
    - remove distribution files
        - rm -r dist
    - connect to with a SFTP client to clarisoft server ( 54.164.207.48 with ppk file )
        - CD branch
            - cd /opt/go.data/web/cd
        - sprint sX
            - cd /opt/go.data/web/sX ( if exists already )
            - cd /opt/go.data/web & mkdir sX & cd sX ( if it doesn't exist )
        - copy the distribution zip file from local to cd / sprint directory
    - remove local zip file
        - rm cd.zip / rm sX.zip
    - connect with Putty to clarisoft server ( ec2-user@54.164.207.48 with ppk file )
        - navigate to cd / sprint sX directory
            - cd /opt/go.data/web/cd / cd /opt/go.data/web/sX
        - remove dist directory if there is one
            - rm -rf dist
        - unzip the zip file
            - unzip cd.zip / unzip sX.zip
        - check that dist directory is there once more
            - ls / ll
        - remove zip file from remote host
            - rm cd.zip / rm sX.zip
        - add sub-domain to virtual hosts ( if it doesn't exist one already for this job )
            - sudo vi /etc/httpd/conf/httpd.conf
            - scroll down until you see web sprint virtual hosts
                e.g:
                <VirtualHost *:80>
                    ServerName who5.clarisoft.com
                    ProxyPass "/" "http://localhost:3105/"
                    ProxyPassReverse "/" "http://localhost:3105/"
                </VirtualHost>
            - add new virtual host ( if necessary - it doesn't exist already )
                <VirtualHost *:80>
                    ServerName whoX.clarisoft.com
                    ProxyPass "/" "http://localhost:310X/"
                    ProxyPassReverse "/" "http://localhost:310X/"
                </VirtualHost>
                - you need to replace the 3 X characters with the sprint number e.g 5 as you can see in the above example
            - save file
                - press escape
                - write ":w" and press enter
                - write ":q" and press enter
            - if you added a new virtual host you need to restart apache
                - sudo service httpd restart
        - add forever job ( or restart job if we have one for this branch )
            - use forever list to see what jobs are running at this point
                - forever list
                    e.g
                    /home/ec2-user/.nvm/versions/node/v6.9.4/bin/node /home/ec2-user/.nvm/versions/node/v6.9.4/bin/angular-http-server -p 3105 --path /opt/go.data/web/s5/dist/
                - if for our branch we already have a job, we just need to restart the job
                    - forever restart UUID => UUID can be taken from forever list
                - if we need to add a new job for our branch:
                    - forever start /home/ec2-user/.nvm/versions/node/v6.9.4/bin/angular-http-server -p 310X --path /opt/go.data/web/sX/dist/
                        - you need to replace the 2 X characters with the sprint number e.g 5 as you can see in the above example
                    - make sure our new job is running
                        - forever list => should display our job now
        - TADA => the new version of the website should be up & running, take a cup of cofee, open a browser and test a bit to make sure it works
