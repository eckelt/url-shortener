package main

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
	"log"
)

// Database interface
type Database interface {
	Get(code string) (string, error)
	Save(url string, code string) (int64, string, error)
}

type sqlite struct {
	Path string
}

func (s sqlite) Save(url string, code string) (int64, string, error) {
	db, err := sql.Open("sqlite3", s.Path)
	tx, err := db.Begin()
	if err != nil {
		return 0, "", err
	}
	stmt, err := tx.Prepare("insert into urls(url, code) values(?, ?)")
	if err != nil {
		return 0, "", err
	}
	defer stmt.Close()
	result, err := stmt.Exec(url, code)
	if err != nil {
		return 0, "", err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, "", nil
	}
	tx.Commit()
	//result
	return id, code, nil
}

func (s sqlite) Get(code string) (string, error) {
	db, err := sql.Open("sqlite3", s.Path)
	stmt, err := db.Prepare("select url from urls where code = ?")
	if err != nil {
		return "", err
	}
	defer stmt.Close()
	var url string
	err = stmt.QueryRow(code).Scan(&url)
	if err != nil {
		return "", err
	}
	return url, nil
}

func (s sqlite) Init() {
	c, err := sql.Open("sqlite3", s.Path)
	if err != nil {
		log.Fatal(err)
	}
	defer c.Close()

	sqlStmt := `create table if not exists urls (id integer not null primary key, code text, url text);`
	_, err = c.Exec(sqlStmt)
	if err != nil {
		log.Fatal(err)
	}
}
