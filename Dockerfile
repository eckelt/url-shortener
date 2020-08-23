############################
# STEP 1 build executable binary
############################
FROM golang AS builder

WORKDIR $GOPATH/src/
COPY . .

# Fetch dependencies.
RUN go get -d -v

# Build the binary.
RUN go build -o /go/bin/url-shortener

############################
# STEP 2 build a small image
############################
FROM scratch

# Copy our static executable.
COPY --from=builder /go/bin/url-shortener /app/url-shortener

# Run the hello binary.
ENTRYPOINT ["/app/url-shortener"]

EXPOSE 1337
