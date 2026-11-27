#!/bin/sh
logrotate -d /etc/logrotate.d/shareframe 2>&1 | grep "^error:" >&2
crond -b -l 8
