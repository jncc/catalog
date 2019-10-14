#!/bin/bash
CONTAINER_NAME=$ECR_REPO:0.0.$BUILD_NUMBER-${GIT_BRANCH:7}-${GIT_COMMIT:0:8}

docker build -t $CONTAINER_NAME $WORKSPACE/
ECR_LOGIN_COMMAND=$(aws --region eu-west-1 ecr get-login --no-include-email)
eval $ECR_LOGIN_COMMAND
docker push $CONTAINER_NAME

#Tag docker image as latest if we are building off master
#This logic makes it safe to clone this pipeline for other branches
if [ ${GIT_BRANCH:7} == "master" ]
then
	echo Tagging build as latest release
	docker tag $CONTAINER_NAME $ECR_REPO:latest
	docker push $ECR_REPO:latest
fi

mkdir -p $WORKSPACE/eb-deploy/.ebextensions
cp $WORKSPACE/.ebextensions/*.config $WORKSPACE/eb-deploy/.ebextensions/
sed -i 's|NGINX_CONFIG_CATALOG_URL|'$NGINX_CONFIG_CATALOG_URL'|g' $WORKSPACE/eb-deploy/.ebextensions/https.config
sed -i 's|SERVER_COMBINED_CRT_PATH|'$SERVER_COMBINED_CRT_PATH'|g' $WORKSPACE/eb-deploy/.ebextensions/https.config
sed -i 's|SERVER_KEY_PATH|'$SERVER_KEY_PATH'|g' $WORKSPACE/eb-deploy/.ebextensions/https.config
sed -i 's|TRUSTED_INTERMEDIATE_CERT_PATH|'$TRUSTED_INTERMEDIATE_CERT_PATH'|g' $WORKSPACE/eb-deploy/.ebextensions/https.config

cp $SSL_SERVER_WITH_CHAIN_CERT $WORKSPACE/eb-deploy/.ebextensions/server_combined_cert.config
sed -i 's|SERVER_COMBINED_CRT_PATH|'$SERVER_COMBINED_CRT_PATH'|g' $WORKSPACE/eb-deploy/.ebextensions/server_combined_cert.config

cp $SSL_CERT_KEY $WORKSPACE/eb-deploy/.ebextensions/server_key.config
sed -i 's|SERVER_KEY_PATH|'$SERVER_KEY_PATH'|g' $WORKSPACE/eb-deploy/.ebextensions/server_key.config

cp $SSL_INTERMEDIATE_CERT_OCSP $WORKSPACE/eb-deploy/.ebextensions/server_trusted_intermediate_cert.config
sed -i 's|TRUSTED_INTERMEDIATE_CERT_PATH|'$TRUSTED_INTERMEDIATE_CERT_PATH'|g' $WORKSPACE/eb-deploy/.ebextensions/server_trusted_intermediate_cert.config

cp $WORKSPACE/Dockerrun.aws.json.template $WORKSPACE/eb-deploy/Dockerrun.aws.json
sed -i 's|0000000000.dkr.ecr.eu-west-1.amazonaws.com/catalog:latest|'$CONTAINER_NAME'|g' $WORKSPACE/eb-deploy/Dockerrun.aws.json
sed -i 's|environment-name|'$TARGET_ENV'|g' $WORKSPACE/eb-deploy/.elasticbeanstalk/config.yml
sed -i 's|application-name|'$TARGET_APP'|g' $WORKSPACE/eb-deploy/.elasticbeanstalk/config.yml
cd $WORKSPACE/eb-deploy/
eb deploy