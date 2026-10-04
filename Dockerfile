FROM debian:bookworm-slim AS build

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libc6-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY back-end/backend.c .
RUN cc -std=c11 -O2 backend.c -o charging-station-server

FROM debian:bookworm-slim

WORKDIR /app
COPY --from=build /src/charging-station-server /app/back-end/charging-station-server
COPY front-end/ /app/front-end/

WORKDIR /app/back-end
CMD ["./charging-station-server"]
