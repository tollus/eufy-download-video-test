require('dotenv').config();
const { Device, Station, HTTPApi, P2PClientProtocol, P2PConnectionType } = require('eufy-security-client')
const fs = require('fs');
const { join } = require('path');

const main = async () => {

  const {
    user,
    password,
    outputfolder,
  } = process.env;

  const httpService = new HTTPApi(user, password);
  await httpService.updateDeviceInfo();
  const hubs = httpService.getHubs();
  const devices = httpService.getDevices();

  // console.log('hubs', hubs);
  // console.log('devices', devices);

  const videos = await httpService.getAllVideoEvents();
  // console.log('Videos', videos);
  console.log('First Video P2P_DID', videos[0].p2p_did);
  console.log('video details:', JSON.stringify(videos[0]));

  const device = new Device(httpService, devices[videos[0].device_sn]);
  const station = new Station(httpService, hubs[videos[0].station_sn]);

  station.on("download start", function (station, channel, metadata, videoStream, audioStream) {
    const filePath = join(outputfolder, 'test.h264');

    const testFile = fs.createWriteStream(filePath, {encoding: 'binary'});
    console.log('Station start_download!: ' + channel);
    console.log('metadata', JSON.stringify(metadata));
    videoStream.pipe(testFile)
      .on('finish', (...args) => {
        console.log('finished piping to test file', args);
      })
      .on('error', (...args) => {
        console.log('error piping to test file', args);
      });
  });

  station.on("download finish", function (station, channel) {
    console.log('Station finish_download!: ' + channel);
    station.close();
  });

  station.on("connect", function (station) {
    console.log('Station connected!');
    station.startDownload(device, videos[0].storage_path, videos[0].cipher_id);
  });

  await station.connect(P2PConnectionType.PREFER_LOCAL, true);

};

main();
