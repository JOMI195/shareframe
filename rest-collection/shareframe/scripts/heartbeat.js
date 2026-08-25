const jitter = (base, pct = 0.1) => +(base * (1 + (Math.random() * 2 - 1) * pct)).toFixed(2);

const BASE = {
  health_state: 'ok',
  boot_count: 7,
  boot_slot: 'A',
  kernel: '6.6.51-shareframe',
  cpu_freq_mhz: 1000,
  ram_total_bytes: 442368000,
  storage_data_total_bytes: 3900000000
};

/** Payload shape of Heartbeat::execute (board): identity, service health, sysinfo. */
function buildHeartbeat({ frameId, localIp, version, uptimeSecs, overrides } = {}) {
  return {
    serial_number: frameId,
    local_ip_address: localIp,
    version,
    websocket_running: true,
    display_running: true,
    dashboard_running: true,
    update_running: true,
    health_state: BASE.health_state,
    uptime_seconds: uptimeSecs ?? Math.floor(process.uptime()) + 3600,
    boot_count: BASE.boot_count,
    boot_slot: BASE.boot_slot,
    time_iso: new Date().toISOString(),
    kernel: BASE.kernel,
    fw_version: version,
    cpu_temp_celsius: jitter(46.2),
    cpu_usage_percent: jitter(12.5, 0.6),
    cpu_freq_mhz: BASE.cpu_freq_mhz,
    load_1: jitter(0.35, 0.5),
    load_5: jitter(0.28, 0.5),
    load_15: jitter(0.22, 0.5),
    ram_total_bytes: BASE.ram_total_bytes,
    ram_available_bytes: Math.floor(jitter(230000000, 0.15)),
    storage_data_total_bytes: BASE.storage_data_total_bytes,
    storage_data_free_bytes: Math.floor(jitter(2600000000, 0.05)),
    ...(overrides || {})
  };
}

module.exports = { buildHeartbeat };
