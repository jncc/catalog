# Image that both builds and runs the catalog database API.

FROM node:26-alpine

RUN mkdir -p /var/log/catalog

WORKDIR /usr/src/app

RUN apk update && apk upgrade && \
    apk add --no-cache python3 py3-pip && \
    python3 -m venv /opt/sphinx-env && \
    /opt/sphinx-env/bin/pip install sphinx

ENV PATH="/opt/sphinx-env/bin:$PATH"

COPY app .

RUN npm install -g corepack && corepack enable
RUN yarn install --immutable && \
    yarn build 

COPY ./config/etc/logrotate.d/application/application.logrotate /etc/logrotate.d/catalog

EXPOSE 8081
CMD [ "node", "built/api/server.js" ]
