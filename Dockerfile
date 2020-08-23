FROM iron/go

WORKDIR /app

ENV SRC_DIR=/go/src/github.com/NilsEckelt/url-shortener/
# Add the source code:
ADD . $SRC_DIR
# Build it:
RUN cd $SRC_DIR; go build -o myapp; cp myapp /app/

ENTRYPOINT ["./myapp"]

EXPOSE 1337
