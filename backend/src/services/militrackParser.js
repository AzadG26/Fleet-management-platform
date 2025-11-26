function millitrackParser(device) {
  // device is the object returned by Millitrack API. Map fields defensively.
  const imei = device.imei || device.deviceId || device.id;
  const name = device.name || device.vehicleName || 'unnamed';
  const lat = parseFloat(device.lat || device.latitude || device.position?.lat || 0);
  const lon = parseFloat(device.lon || device.longitude || device.position?.lon || 0);
  const speed = parseFloat(device.speed || device.velocity || 0);
  const ignition = device.ignition === '1' || device.ignition === true || device.input?.ignition === 1;
  const motion = device.motion === '1' || device.motion === true || speed > 0.5;
  const totalDistance = parseFloat(device.totalDistance || device.odometer || device.attributes?.totalDistance || 0);
  const todayDistance = parseFloat(device.todayDistance || device.attributes?.todayDistance || 0);
  const timestamp = device.timestamp ? new Date(device.timestamp) : (device.lastUpdate ? new Date(device.lastUpdate) : new Date());
  return { imei, name, lat, lon, speed, ignition, motion, totalDistance, todayDistance, timestamp };
}

module.exports = { millitrackParser };
