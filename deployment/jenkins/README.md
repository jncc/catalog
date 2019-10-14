# Jenkins Deployment Setup

 1. Create a `secret file` Jenkins credential for each of the `.config` files in the `deployment/jenkins/ssl-config` folder, replacing the text with the relevant cert / key to be deployed
 2. Create a Jenkins job with the build task being to run the included `jenkins-deployment.sh` file, which should import the required SSL deployments and push an elastic beanstalk deploy
  - Inject the `secret file` for each `.config` file from step 1 into the build environment as;
    - `SSL_SERVER_WITH_CHAIN_CERT` - `server_combined_cert.config` - Contains the SSL certifcate you want to deploy, combined with any relevant chain
    - `SSL_CERT_KEY` - `server_key.config` - Contains the private key for the SSL certificate you want to deploy
    - `SSL_INTERMEDIATE_CERT_OCSP` - `server_trusted_intermediate_cert.config` - Contains the intermediate certificate for your SSL certificate authority to be used during OCSP stapling
  - Set the environment variables;
    - `ECR_REPO` - The ECR repo being used to host the output docker container for this build
    - `TARGET_APP` - The name of the elasticbeanstalk application that we are deploying for
    - `TARGET_ENV` - The environment of the elasticbeanstalk application that we are deploying to
    - `NGINX_CONFIG_CATALOG_URL` - The final deployment URL that this service will live under
    - `SERVER_COMBINED_CRT_PATH` - The full path on the instance to the combined ssl cert i.e. `/etc/pki/tls/certs/server.crt`
    - `SERVER_KEY_PATH` - The full path on the instance to the key for the ssl cert i.e. `/etc/pki/tls/private/server.key`
    - `TRUSTED_INTERMEDIATE_CERT_PATH` - The full path on the instance to the trusted intermediate ssl cert (for OCSP stapling) i.e. `/etc/pki/tls/certs/trusted.crt`
