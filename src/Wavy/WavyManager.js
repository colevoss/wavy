const ZOOM_RATIO = 0.01;

export default class WavyManager {
  updateableProps = ['zoom', 'height', 'startMs', 'endMs'];

  constructor(buffer, zoom, height, startMs, endMs) {
    this.buffer = buffer;
    this.zoom = zoom;
    this.height = height;
    this.sampleRate = this.buffer.sampleRate;

    this.initSampleMetaData();

    this.startMs = startMs || 0;
    this.endMs = endMs || this.durationMs();
  }

  onUpdate(fn) {
    this.updateSubscriber = fn;
  }

  broadcastUpdate() {
    this.updateSubscriber && this.updateSubscriber();
  }

  pruneUpdateData = (key, data) => {
    return this.updateableProps.indexOf(key) > -1 && this[key] !== data[key];
  };

  update(data) {
    Object.keys(data)
      .filter((key) => this.pruneUpdateData(key, data))
      .forEach((key) => {
        switch (key) {
          case 'zoom':
            this.updateZoom(data.zoom);
            return;

          case 'height':
            this.updateHeight(data.height);
            return;
        }
      });

    this.broadcastUpdate();
  }

  updateZoom(zoom) {
    this.tmpZoom = zoom;

    this.throttleZoomUpdate(zoom);
  }

  updateHeight(height) {
    this.height = height;

    this.broadcastUpdate();
  }

  throttleZoomUpdate(zoom) {
    if (this.zoomTimeout) clearTimeout(this.zoomTimeout);

    this.zoomTimeout = setTimeout(() => {
      this.zoom = this.tmpZoom;
      this.tmpZoom = null;
      this.downsample();
    }, 100);
  }

  initSampleMetaData() {
    this.samplesPerMs = this.sampleRate * 1000;
    this.msPerSample = this.sampleRate / 1000;
  }

  durationMs() {
    return this.endMs - this.startMs;
  }

  msToSample(ms) {
    return ms * this.msPerSample;
  }

  convertAmplitudeToPx(amp) {
    return this.height / 2 - this.height / 2 * amp;
  }

  startSample() {
    return Math.floor(this.msToSample(this.startMs));
  }

  endSample() {
    return Math.ceil(this.msToSample(this.endMs));
  }

  totalSamples() {
    return this.endSample() - this.startSample();
  }

  width() {
    return this.durationMs() * ZOOM_RATIO * (this.tmpZoom || this.zoom);
  }

  chunkSize() {
    return this.totalSamples() / this.durationMs() * 100 / this.zoom;
  }

  samples() {
    return this.buffer.getChannelData(0);
  }

  async downsample() {
    const startSample = this.startSample();
    const endSample = this.endSample();
    const samples = this.samples();
    const chunkSize = this.chunkSize();

    const chunkSamples = [[0, 0]];

    for (let sample = startSample; sample <= endSample; sample++) {
      const i = sample - startSample;
      const chunkNum = Math.floor(i / chunkSize);

      const bufferSample = samples[sample];
      const chunkSample = chunkSamples[chunkNum] || chunkSamples.push([0, 0]);

      if (chunkSample[0] < bufferSample) {
        chunkSample[0] = bufferSample;
      }

      if (chunkSample[1] > bufferSample) {
        chunkSample[1] = bufferSample;
      }
    }

    this.downsamples = chunkSamples;

    this.broadcastUpdate();
  }

  svgData() {
    if (!this.downsamples) return '';

    let positivePoints = '';
    let negativePoints = '';

    const chunkCount = this.downsamples.length;
    const totalSamples = this.msToSample(this.durationMs());
    const totalChunks = totalSamples / this.chunkSize();
    const sampleWidth = this.width() / totalChunks;

    for (let i = 0; i < chunkCount; i++) {
      const high = this.convertAmplitudeToPx(this.downsamples[i][0]);
      const low = this.convertAmplitudeToPx(this.downsamples[i][1]);

      const x = sampleWidth * i;

      positivePoints += `${x} ${high},`;
      negativePoints = `${x} ${low},${negativePoints}`;

      if (i === 0) negativePoints = negativePoints.slice(0, -1);
    }

    return positivePoints + negativePoints;
  }
}
