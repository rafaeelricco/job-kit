FROM node:22-alpine
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=notepad-pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 8080
CMD ["pnpm", "start"]
