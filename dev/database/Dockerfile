
FROM mdillon/postgis
RUN apt-get update && apt-get -y install sudo
WORKDIR /setup
COPY ./setup-scripts .
RUN chmod +x ./setup.sh
COPY ./data .
