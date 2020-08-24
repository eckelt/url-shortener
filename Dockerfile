############################
# STEP 1 build executable binary
############################
FROM golang AS builder

WORKDIR $GOPATH/src/
COPY . .

# Fetch dependencies.
RUN go get -d -v

# Build the binary.
RUN CGO_ENABLED=0 go build -o /go/bin/url-shortener

############################
# STEP 2 build a small image
############################
FROM alpine:latest  

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /go/bin/url-shortener .
CMD ["./url-shortener"] 

EXPOSE 1337
