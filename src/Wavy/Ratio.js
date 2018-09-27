// pxPerSecond = 100
// sampleRate = 200

export default class Ratio {
  constructor(
    ratio,
    buffer,
    height,
    startMs,
    endMs,
    selectedMsStart,
    selectedMsEnd,
  ) {
    // Ratio represents pixels per second of audio
    this.ratio = ratio;
    this.buffer = buffer;
    this.startMs = startMs || 0;
    this.endMs = endMs || this.bufferDurationMs();
    this.height = height;
    this.selectedMsStart = selectedMsStart;
    this.selectedMsEnd = selectedMsEnd;

    // console.log(this.bufferDurationSeconds);
    // console.log(this.width);
  }

  onUpdate(fn) {
    this.updateSubscriber = fn;
  }

  broadcastUpdate() {
    this.updateSubscriber && this.updateSubscriber();
  }

  get sampleRate() {
    return this.buffer.sampleRate;
  }

  get bufferDurationSeconds() {
    return this.buffer.duration;
  }

  get bufferDurationMs() {
    return this.durationSeconds * 1000;
  }

  get durationMs() {
    return this.endMs - this.startMs;
  }

  get durationSeconds() {
    return this.durationMs / 1000;
  }

  get samplesPerPixel() {
    return this.sampleRate / this.ratio;
  }

  get msPerPx() {
    return this.ratio * 1000;
  }

  get msPerSample() {
    return this.sampleRate / 1000;
  }

  get samplesPerMs() {
    return this.sampleRate * 1000;
  }

  get width() {
    // return Math.ceil(this.ratio * this.durationSeconds);
    return this.ratio * this.durationSeconds;
  }

  msToSample(ms) {
    return ms * this.msPerSample;
  }

  convertAmplitudeToPx(amp) {
    return this.height / 2 - (this.height / 2) * amp;
  }

  get startSample() {
    return Math.floor(this.msToSample(this.startMs));
  }

  get endSample() {
    return Math.ceil(this.msToSample(this.endMs));
  }

  get samples() {
    return this.buffer.getChannelData(0);
  }

  hasSelection() {
    return this.selectedMsStart && this.selectedMsEnd;
    // return false;
  }

  get selectedPxStart() {
    return this.ratio * (this.selectedMsStart / 1000);
  }

  get selectedPxEnd() {
    return this.ratio * (this.selectedMsEnd / 1000);
  }

  downsample() {
    // console.time('Downsample');
    // const startSample = this.startSample;
    // const endSample = this.endSample;
    const chunkSize = ~~this.samplesPerPixel;
    const samples = this.samples;

    // this.downsamples = [[0, 0]];
    // this.downsamples = [];
    const downsamples = [];

    const numberOfBuckets = ~~(samples.length / chunkSize);

    for (let i = 0; i < numberOfBuckets; i++) {
      let max = 0;
      let min = 0;

      for (let j = i * chunkSize; j < i * chunkSize + chunkSize; j++) {
        if (samples[j] > max) {
          max = samples[j];
        }

        if (samples[j] < min) {
          min = samples[j];
        }
      }

      downsamples.push([max, min]);
    }
    // console.timeEnd('Downsample');

    // this.broadcastUpdate();
    this.drawUpdate(downsamples);

    // for (let sample = startSample; sample <= endSample; sample++) {
    //   const i = sample - startSample;

    //   // Which chunk are we currently comparing the current sample to
    //   // const chunkNum = Math.floor(i / chunkSize);
    //   const chunkNum = ~~(i / chunkSize);

    //   // Create a new array to represent this chunk if this is the first sample for this chunk
    //   if (this.downsamples[chunkNum] === undefined) {
    //     this.downsamples.push([0, 0]);
    //   }

    //   if (this.downsamples[chunkNum][0] < samples[sample]) {
    //     this.downsamples[chunkNum][0] = samples[sample];
    //   } else if (this.downsamples[chunkNum][1] > samples[sample]) {
    //     this.downsamples[chunkNum][1] = samples[sample];
    //   }
    // }

    // this.broadcastUpdate();
  }

  drawUpdate(downsamples) {
    // if (!downsamples) return '';

    // let positivePoints = '';
    // let negativePoints = '';

    // let positivePoints = `0 ${~~this.convertAmplitudeToPx(downsamples[0][0])},`;
    // let negativePoints = `0 ${~~this.convertAmplitudeToPx(downsamples[0][1])}`;

    let positivePoints = `M 0 ${~~this.convertAmplitudeToPx(
      downsamples[0][0],
    )} `;
    let negativePoints = `M 0 ${~~this.convertAmplitudeToPx(
      downsamples[0][1],
    )}`;

    const chunkCount = downsamples.length;

    let i = 0;

    console.time('Draw');
    while (++i < chunkCount) {
      // positivePoints +=
      //   i + ' ' + this.convertAmplitudeToPx(downsamples[i][0]) + ',';

      // negativePoints =
      //   i +
      //   ' ' +
      //   this.convertAmplitudeToPx(downsamples[i][1]) +
      //   ',' +
      //   negativePoints;

      // positivePoints += `${i} ${~~this.convertAmplitudeToPx(
      //   downsamples[i][0],
      // )},`;

      // negativePoints = `${i} ${~~this.convertAmplitudeToPx(
      //   downsamples[i][1],
      // )},${negativePoints}`;

      positivePoints += `L ${i} ${~~this.convertAmplitudeToPx(
        downsamples[i][0],
      )} `;

      negativePoints = `L ${i} ${~~this.convertAmplitudeToPx(
        downsamples[i][1],
      )} ${negativePoints}`;

      // i++;
    }

    // for (let i = 0, chunkCount = downsamples.length; i < chunkCount; i++) {
    //   positivePoints += `${i} ${this.convertAmplitudeToPx(downsamples[i][0])},`;

    //   negativePoints = `${i} ${this.convertAmplitudeToPx(
    //     downsamples[i][1],
    //   )},${negativePoints}`;

    //   if (i === 0) negativePoints = negativePoints.slice(0, -1);
    // }

    this.points = positivePoints + negativePoints;
    console.timeEnd('Draw');

    this.broadcastUpdate();
  }

  // draw() {
  //   if (!this.downsamples) return '';

  //   let positivePoints = '';
  //   let negativePoints = '';

  //   const chunkCount = this.downsamples.length;

  //   for (let i = 0; i < chunkCount; i++) {
  //     positivePoints += `${i} ${this.convertAmplitudeToPx(
  //       this.downsamples[i][0],
  //     )},`;

  //     negativePoints = `${i} ${this.convertAmplitudeToPx(
  //       this.downsamples[i][1],
  //     )},${negativePoints}`;

  //     if (i === 0) negativePoints = negativePoints.slice(0, -1);
  //   }

  //   return positivePoints + negativePoints;
  // }
}
