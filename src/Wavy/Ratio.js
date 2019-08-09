// pxPerSecond = 100
// sampleRate = 200
import { curveNatural, area } from 'd3-shape';
import * as d3Select from 'd3-selection';
import * as d3Trans from 'd3-transition';

const GRANULARITY = 2;

export default class Ratio {
  constructor(
    ratio,
    buffer,
    height,
    startMs,
    endMs,
    selectedMsStart,
    selectedMsEnd,
    waveformId,
  ) {
    // Ratio represents pixels per second of audio
    this.ratio = ratio;
    this.buffer = buffer;
    this.startMs = startMs || 0;
    this.endMs = endMs || this.bufferDurationMs();
    this.height = height;
    this.selectedMsStart = selectedMsStart;
    this.selectedMsEnd = selectedMsEnd;

    this.waveformId = waveformId;

    this.waveformPath = d3Select.select(`path#${this.waveformId}`);
    this.transition = d3Trans.transition().duration(100);

    console.log(this.waveformPath);

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
    return (this.sampleRate / this.ratio) * GRANULARITY;
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
    this.waveformPath = d3Select.select(`path#${this.waveformId}`);
    console.time('Downsample');
    const chunkSize = ~~this.samplesPerPixel;
    const samples = this.samples;

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

      // downsamples.push([
      //   this.convertAmplitudeToPx(max).toFixed(2),
      //   this.convertAmplitudeToPx(min).toFixed(2),
      // ]);

      downsamples.push([max, min]);
    }
    console.timeEnd('Downsample');
    // console.timeEnd('Downsample');

    // this.broadcastUpdate();
    // this.drawUpdate(downsamples);
    this.d3Draw(downsamples);
  }

  d3Draw(downsamples) {
    const a = area();

    console.time('DrawD3');
    // a.x((d, i) => i * GRANULARITY)
    //   .y0((d) => d[1])
    //   .y1((d) => d[0]);
    a.x((d, i) => i * GRANULARITY)
      .y0((d) => this.convertAmplitudeToPx(d[1]))
      .y1((d) => this.convertAmplitudeToPx(d[0]));

    this.points = a(downsamples);

    console.log(this.points);

    this.waveformPath.attr('d', this.points);
    console.timeEnd('DrawD3');

    // this.broadcastUpdate();
  }

  drawUpdate(downsamples) {
    // if (!downsamples) return '';

    // let positivePoints = '';
    // let negativePoints = '';

    // let positivePoints = `0 ${~~this.convertAmplitudeToPx(downsamples[0][0])},`;
    // let negativePoints = `0 ${~~this.convertAmplitudeToPx(downsamples[0][1])}`;

    // let positivePoints = `M 0 ${~~this.convertAmplitudeToPx(
    //   downsamples[0][0],
    // )} `;

    // let negativePoints = `M 0 ${~~this.convertAmplitudeToPx(
    //   downsamples[0][1],
    // )}`;

    let positivePoints = `M 0 ${downsamples[0][0]} `;

    let negativePoints = `L 0 ${downsamples[0][1]} Z`;

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

      positivePoints += `${i * GRANULARITY} ${this.convertAmplitudeToPx(
        downsamples[i][0],
      )},`;

      negativePoints = `${i * GRANULARITY} ${this.convertAmplitudeToPx(
        downsamples[i][1],
      )},${negativePoints}`;

      // positivePoints += `L ${i} ${downsamples[i][0]} `;

      // negativePoints = `L ${i} ${downsamples[i][1]} ${negativePoints}`;

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
