FROM node:lts-alpine@sha256:8263de4a04679fabfdbda4e3a18de44d303ec5ba4dd3dafaf5fdc69af7164fd6

USER node

WORKDIR /home/node/

COPY --chown=node:node ./ ./

RUN npm install --only=prod

ENV NODE_ENV=production

CMD ["npm", "run", "start"]