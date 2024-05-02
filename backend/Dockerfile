FROM rust:slim

WORKDIR /app

COPY Cargo* .

RUN cargo fetch

COPY . .

RUN cargo install --path .

EXPOSE 4000

CMD ["backend"]

# TODO: Add multi stage build