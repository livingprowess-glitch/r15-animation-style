#!/bin/sh
# usage: rbxrun.sh <lua file> <out file>   retries until the edit DataModel (with loadstring) answers
for i in $(seq 1 20); do
	powershell -NoProfile -ExecutionPolicy Bypass -File C:/Users/osaya/rbxbridge/rbx.ps1 -Op run -File "$1" -TimeoutSec 120 > "$2" 2>&1
	if ! grep -q "loadstring() is not available" "$2"; then exit 0; fi
done
echo "gave up after 20 tries" >&2
exit 1
