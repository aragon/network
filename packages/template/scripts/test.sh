#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the aragon devchain instance that we started (if we started one and if it's still running).
  if [ -n "$devchain_pid" ] && ps -p $devchain_pid > /dev/null; then
    kill -9 $devchain_pid
  fi
}

start_devchain() {
  echo "Starting aragon devchain..."
  aragon devchain --reset > /dev/null &
  devchain_pid=$!
  sleep 3
  echo "Running aragon devchain with pid ${devchain_pid}"
}

run_tests() {
  echo "Running tests $@..."
  buidler test --network localhost
}

start_devchain
run_tests $@
