FROM node:21 AS frontend
WORKDIR /app
COPY ui .
RUN npm i && npm run build

FROM --platform=linux/amd64 messense/rust-musl-cross:x86_64-musl AS amd64-chef
RUN cargo install cargo-chef
WORKDIR /app

FROM --platform=linux/arm64 messense/rust-musl-cross:aarch64-musl AS arm64-chef
RUN cargo install cargo-chef
WORKDIR /app

FROM ${TARGETARCH}-chef AS planner
COPY backend .
RUN cargo chef prepare --recipe-path recipe.json

FROM ${TARGETARCH}-chef AS builder
ARG TARGETARCH
ARG BINARY_NAME=simple-file-transfer
COPY --from=planner /app/recipe.json recipe.json
RUN set -ex; \
    case ${TARGETARCH} in \
    arm64) target='aarch64' ;; \
    amd64) target='x86_64' ;; \
    *) exit 1 ;; \
    esac; \
    echo "Building for ${TARGETARCH} (${target})" && \
    curl -sSL https://github.com/upx/upx/releases/download/v4.2.4/upx-4.2.4-${TARGETARCH}_linux.tar.xz -o upx.tar.xz && \
    tar -xf upx.tar.xz && \
    cd upx-*-${TARGETARCH}_linux && \
    mv upx /bin/upx && \
    cd .. && \
    cargo chef cook --release --target $target-unknown-linux-musl --recipe-path recipe.json

COPY backend .

RUN set -ex; \
    case ${TARGETARCH} in \
    arm64) target='aarch64' ;; \
    amd64) target='x86_64' ;; \
    *) exit 1 ;; \
    esac; \
    cargo build --release --target $target-unknown-linux-musl --bin ${BINARY_NAME} && \
    mv ./target/$target-unknown-linux-musl/release/${BINARY_NAME} /build && \
    upx --best --lzma /build

FROM scratch AS runtime
COPY --from=builder /build /app
COPY --from=frontend /app/dist /static
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
EXPOSE 3000
CMD ["/app"]
