FROM node:10.15.1

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
#ADD api api

RUN npm install

#RUN apt update
#RUN apt install python-pip -y
#RUN pip install sphinx sphinx-autobuild

#ADD docs docs

#RUN npm run-script build

# Bundle app source
ADD built built

EXPOSE 8080
CMD [ "npm", "start" ]
