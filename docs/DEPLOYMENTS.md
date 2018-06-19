B. In case you need to create a new sprint server ( if you don't - sprint server already exist, jump over these steps )
1. make sure subdomain whoN.clarisoft.com points to the proper server ( where N = sprint number e.g who3.clarisoft.com )
2. change virtual host to point to handle the new subdomain ( update proxy - point to the new server - probably you need to update the port ) 

B. Deployment
1. Make sure envioment config files ( both dev & prod ) point to the proper sprint revision api
2. Create PR ( from master to sprint branch (  e.g. s3 ) )
3. Merge PR
4. Switch to branch PR
5. remove dist directory ( project root ) - optional
6. run npm run build - to build dist directory from the new rev
7. zip / tag dist dir ( e.g. "zip go.Data_s3_20180619.zip dist -r" - replace sprint number and date )
8. copy zip to server ( you can use filezilla - sftp with key )
9. make backup dod fist directory
10. remove unnecessary files from dist
11. unzip archive ( e.g. "unzip go.Data_s3_20180619.zip" )
12. restart service ( "forever list" + "forever restart pid" ) 
13. jump over 13 because it brings bad luck
14. test website
15. remove dist backup ( don't remove zip files )
