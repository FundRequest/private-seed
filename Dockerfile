FROM debian:8.7
LABEL maintainer "karel@striegel.be"

RUN apt-get update && \
    apt-get upgrade && \
    apt-get install curl vim git -y && \
    curl -sL https://deb.nodesource.com/setup_7.x |  bash - && \
    apt-get install -y nodejs 

RUN npm init -y && \
    npm install --save http-server

RUN mkdir /src/

COPY dist /src/

WORKDIR /src/
EXPOSE 8080

ENTRYPOINT ["http-server"]
#CMD ["node","server.js"]
