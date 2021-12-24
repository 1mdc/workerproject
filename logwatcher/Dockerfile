FROM golang:1.17 AS builder
RUN mkdir -p /opt/app
COPY ./ /opt/app
WORKDIR /opt/app
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY --from=builder /opt/app/app ./
CMD ["./app"]