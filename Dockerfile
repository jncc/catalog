FROM node:10.15.1

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
#ADD api api

RUN npm install

# Bundle app source
ADD built built

# Copy log rotation script
COPY ./config/application.logrotate /etc/logrotate.d/application

EXPOSE 8081
CMD [ "npm", "start" ]
