############################
# STEP 1 build executable binary
############################
FROM golang AS builder

WORKDIR $GOPATH/src/
COPY . .

# Fetch dependencies.
RUN go get -d -v

# Build the binary.
RUN GOOS=linux go build  -ldflags="-extldflags=-static" -tags sqlite_omit_load_extension -o /go/bin/url-shortener-app

############################
# STEP 2 get root certificates
############################
FROM alpine:3.6 as alpine

RUN apk add -U --no-cache ca-certificates

############################
# STEP 2 build a small image
############################
FROM scratch
COPY --from=alpine /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
ADD sca1b.crt /etc/ssl/certs/

COPY --from=builder /go/bin/url-shortener-app .
CMD ["./url-shortener-app"] 
EXPOSE 1337
