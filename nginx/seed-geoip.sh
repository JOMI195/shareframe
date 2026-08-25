#!/bin/sh
set -e
mkdir -p /etc/nginx/geoip
[ -f /etc/nginx/geoip/GeoLite2-City.mmdb ] || \
  cp /usr/share/GeoIP-baseline/GeoLite2-City.mmdb /etc/nginx/geoip/
