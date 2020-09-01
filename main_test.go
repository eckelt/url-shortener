package main

import "testing"

func TestGenerateCodeBasedOnSha256(t *testing.T) {
	length := 4
	got := generateCodeFrom("https://ecke.lt", length)
	if got != "83624c9dd02b44bcc66a30cf4e945fef160915677ceacb32fd3bd18933234377"[0:length] {
		t.Errorf("%s is not the sha256 hash-snippet we've expected", got)
	}
}
func TestGenerateCodeIsRandom(t *testing.T) {
	length := 4
	got := generateCode(length)
	if len(got) != length {
		t.Errorf("wanted code with length %d but got this %d: %s", length, len(got), got)
	}
}
