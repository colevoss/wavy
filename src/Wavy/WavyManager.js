// @flow

const ZOOM_RATIO = 0.01;

// type UpdateableProps = 'zoom' | 'height' | 'startMs' | 'endMs';

type UpdateData = {
  zoom: number,
  height: number,
  startMs: number,
  endMs: number,
};

export default class WavyManager {
  updateableProps = ['zoom', 'height', 'startMs', 'endMs'];

  buffer: AudioBuffer;
  zoom: number;
  tmpZoom: ?number;
  height: number;
  startMs: number;
  endMs: number;
  selectedMsStart: number;
  selectedMsEnd: number;
  samplesPerMs: number;
  msPerSample: number;
  sampleRate: number;
  downsamples: number[][];
  zoomTimeout: TimeoutID;
  updateSubscriber: Function;

  constructor(
    buffer: AudioBuffer,
    zoom: number,
    height: number,
    startMs: number,
    endMs: number,
    selectedMsStart: number,
    selectedMsEnd: number,
  ) {
    // AdioBuffer
    this.buffer = buffer;
    this.sampleRate = this.buffer.sampleRate;
    this.zoom = zoom;
    this.height = height;

    // Where the selection begins and ends
    this.selectedMsStart = selectedMsStart;
    this.selectedMsEnd = selectedMsEnd;

    this.initSampleMetaData();

    // What ms waveform should start rendering at
    this.startMs = startMs || 0;
    // What ms the waveform should end rendering
    this.endMs = endMs || this.durationMs();
  }

  hasSelection(): boolean {
    return this.selectedMsStart !== null || this.selectedMsEnd !== null;
  }

  onUpdate(fn: Function) {
    this.updateSubscriber = fn;
  }

  broadcastUpdate() {
    this.updateSubscriber && this.updateSubscriber();
  }

  // pruneUpdateData = (key: UpdateableProps, data: UpdateData) => {
  //   return this.updateableProps.indexOf(key) > -1 && this[key] !== data[key];
  // };

  update(data: UpdateData) {
    Object.keys(data)
      // .filter((key) => this.pruneUpdateData(key, data))
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

  updateZoom(zoom: number) {
    this.tmpZoom = zoom;

    this.throttleZoomUpdate(zoom);
  }

  updateHeight(height: number) {
    this.height = height;
  }

  updateSelectedMsStart(ms: number) {
    this.selectedMsStart = ms;
  }

  updateSelectedMsEnd(ms: number) {
    this.selectedMsEnd = ms;
  }

  throttleZoomUpdate(zoom: number) {
    if (this.zoomTimeout) clearTimeout(this.zoomTimeout);

    this.zoomTimeout = setTimeout(() => {
      this.zoom = this.tmpZoom || zoom;
      this.tmpZoom = null;
      this.downsample();
    }, 100);
  }

  /**
   * Since sample rate is Samples/Second, we need to get the samples
   * per ms as well as how many ms are represented per sample
   */
  initSampleMetaData() {
    this.samplesPerMs = this.sampleRate * 1000;
    this.msPerSample = this.sampleRate / 1000;
  }

  durationMs() {
    return this.endMs - this.startMs;
  }

  msToSample(ms: number) {
    return ms * this.msPerSample;
  }

  convertAmplitudeToPx(amp: number) {
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

  msToPx(ms: number) {
    return ms * ZOOM_RATIO * (this.tmpZoom || this.zoom);
  }

  selectedPxStart() {
    return this.msToPx(this.selectedMsStart || 0);
  }

  selectedPxEnd() {
    return this.msToPx(this.selectedMsEnd || this.durationMs());
  }

  width() {
    return this.durationMs() * ZOOM_RATIO * (this.tmpZoom || this.zoom);
  }

  chunkSize() {
    // return this.totalSamples() / this.durationMs() * 100 / this.zoom * 1.75;
    return this.totalSamples() / this.durationMs() * 100 / this.zoom;
  }

  samples() {
    return this.buffer.getChannelData(0);
  }

  async downsample() {
    const startSample = this.startSample();
    const endSample = this.endSample();
    const samples = this.samples();
    const chunkSize = Math.round(this.chunkSize());

    const chunkSamples = [[0, 0]];

    /**
     * Loop over each eample in the buffer from start to end sample
     */
    for (let sample = startSample; sample <= endSample; sample++) {
      // `i` represents a 0 + n like a normal loop
      const i = sample - startSample;

      // Which chunk are we currently comparing the current sample to
      const chunkNum = Math.floor(i / chunkSize);

      // Create a new array to represent this chunk if this is the first sample for this chunk
      if (chunkSamples[chunkNum] === undefined) {
        chunkSamples.push([0, 0]);
      }

      if (chunkSamples[chunkNum][0] < samples[sample]) {
        chunkSamples[chunkNum][0] = samples[sample];
      } else if (chunkSamples[chunkNum][1] > samples[sample]) {
        chunkSamples[chunkNum][1] = samples[sample];
      }
    }

    this.downsamples = chunkSamples;

    this.broadcastUpdate();
  }

  svgData = () => {
    if (!this.downsamples) return '';

    let positivePoints = '';
    let negativePoints = '';

    const chunkCount = this.downsamples.length;
    const totalSamples = this.msToSample(this.durationMs());
    const totalChunks = totalSamples / this.chunkSize();
    const sampleWidth = this.width() / totalChunks;

    for (let i = 0; i < chunkCount; i++) {
      const x = sampleWidth * i;

      const high = this.convertAmplitudeToPx(this.downsamples[i][0]);
      const low = this.convertAmplitudeToPx(this.downsamples[i][1]);

      positivePoints += `${x} ${high},`;
      negativePoints = `${x} ${low},${negativePoints}`;

      if (i === 0) negativePoints = negativePoints.slice(0, -1);
    }

    return positivePoints + negativePoints;
  };
}
