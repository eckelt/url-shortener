# url-shortener
Simple URL shortener backed by sqlite.

Using the API

        $ curl -X POST http://mydomain.com/save -d '{"url": "http://google.com"}'
        {"error":"","id":"M","url":"http://mydomain.com/M"}

There's also a simple web ui available

#### Run in docker:

    docker run -dv /local/data/path:/data \
    	-p 1337:1337 \
    	-e BASE_URL=http://mydomain.com \
    	-e DB_PATH=/data \
    	jhaals/url-shortener

or use `docker-compose`  

    docker-compose up -d

#### Update the certificate

1. Open the url https://maker.ifttt.com/trigger/<TRIGGER>/with/key/<KEY> to see the certificate. Download that one.
2. Upload that certificate to github
3. Use this certificate in the `Dockerfile`
