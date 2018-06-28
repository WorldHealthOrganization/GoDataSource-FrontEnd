A. In case you need to create a new sprint server ( if you don't - sprint server already exist, jump over these steps )
1. make sure subdomain whoN.clarisoft.com points to the proper server ( where N = sprint number e.g who3.clarisoft.com )
2. change virtual host to point to handle the new subdomain ( update proxy - point to the new server - probably you need to update the port ) 

B. Deployment
1. Make sure envioment config files ( both dev & prod ) point to the proper sprint revision api
2. create branch if it doesn't exist ( e.g s4 )
2.1 Create PR ( from master to sprint branch (  e.g. s3 ) ) - if necessary to update branch
2.2 Merge PR
3. Switch to branch PR
4. remove dist directory ( project root ) - optional
5. run npm run build - to build dist directory from the new rev
6. zip / tar dist dir ( e.g. "zip go.Data_s3_20180619.zip dist -r" - replace sprint number and date )
7. copy zip to server ( you can use filezilla - sftp with key )
8. backup dist directory ( in case you had a stable version deployed which you update )
9. remove unnecessary files from dist ( if dist exists, otherwise create directory )
10. unzip archive ( e.g. "unzip go.Data_s3_20180619.zip" )
11. restart service ( "forever list" + "forever restart pid" ) 
12. jump over 13 because it brings bad luck
13. test website
14. remove dist backup ( don't remove zip files )
