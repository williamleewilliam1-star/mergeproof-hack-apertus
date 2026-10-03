FROM node:22-alpine
WORKDIR /app
COPY src/mergeproof/ ./
ENV HOST=0.0.0.0
ENV PORT=8789
EXPOSE 8789
CMD ["node", "dev-server.js"]
