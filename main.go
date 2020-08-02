package main

import (
	"encoding/json"
	"github.com/asaskevich/govalidator"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path"
)

const base string = "0123456789abcdfghjkmnpqrstvwxyzABCDFGHJKLMNPQRSTVWXYZ"

func generateCode(n int) string {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    b := make([]byte, n)
    for i := range b {
        b[i] = letters[rand.Intn(len(letters))]
    }
    return string(b)
}

func decodeHandler(response http.ResponseWriter, request *http.Request, db Database) {
	code := mux.Vars(request)["code"]
	url, err := db.Get(code)
	if err != nil {
		http.Error(response, `{"error": "No such URL"}`, http.StatusNotFound)
		return
	}
	http.Redirect(response, request, url, 301)
}

func encodeHandler(response http.ResponseWriter, request *http.Request, db Database, baseURL string) {
	decoder := json.NewDecoder(request.Body)
	var data struct {
		URL string `json:"url"`
		code string `json:"code"`
	}
	err := decoder.Decode(&data)
	if err != nil {
		http.Error(response, `{"error": "Unable to parse json"}`, http.StatusBadRequest)
		return
	}

	if !govalidator.IsURL(data.URL) {
		http.Error(response, `{"error": "Not a valid URL"}`, http.StatusBadRequest)
		return
	}

	var requestedCode = data.code
	if len(data.code)<2 {
		requestedCode = generateCode(4)
	}

	_, code, err := db.Save(data.URL, requestedCode)
	if err != nil {
		log.Println(err)
		return
	}

	resp := map[string]string{"url": baseURL + code, "code": code, "requested-code": data.code, "error": ""}
	jsonData, _ := json.Marshal(resp)
	response.Write(jsonData)

}

func main() {

	if os.Getenv("BASE_URL") == "" {
		log.Fatal("BASE_URL environment variable must be set")
	}
	if os.Getenv("DB_PATH") == "" {
		log.Fatal("DB_PATH environment variable must be set")
	}
	db := sqlite{Path: path.Join(os.Getenv("DB_PATH"), "db.sqlite")}
	db.Init()

	baseURL := os.Getenv("BASE_URL")

	r := mux.NewRouter()
	r.HandleFunc("/save",
		func(response http.ResponseWriter, request *http.Request) {
			encodeHandler(response, request, db, baseURL)
		}).Methods("POST")
	r.HandleFunc("/{code}", func(response http.ResponseWriter, request *http.Request) {
		decodeHandler(response, request, db)
	})
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("public")))
	log.Println("Starting server on port :1337")
	log.Fatal(http.ListenAndServe(":1337", handlers.LoggingHandler(os.Stdout, r)))
}
