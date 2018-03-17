import React from 'react';

const CHUNK_SIZE = 2048;
const HEIGHT = 200;
const ZOOM_RATIO = 0.01;

export default class Wavy extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      realZoom: props.zoom,
    };
  }

  componentDidMount() {
    this.downsample();
  }

  convertAmplitudeToPx(amp) {
    return HEIGHT / 2 - HEIGHT / 2 * amp;
  }

  componentWillUpdate(nextProps) {
    if (this.props.zoom !== nextProps.zoom) {
      this.updateZoom(nextProps.zoom);
    }
  }

  updateZoom(zoom) {
    if (this.zoomUpdateTimeout) {
      clearTimeout(this.zoomUpdateTimeout);
    }

    this.zoomUpdateTimeout = setTimeout(() => {
      this.setState(() => ({ realZoom: zoom }), this.downsample);
    }, 300);
  }

  chunkSize() {
    return this.totalSamples() / this.duration() * 100 / this.state.realZoom;
  }

  points() {
    const renderSamples = this.renderSamples;

    if (!renderSamples) return '';

    let convertedData = '';
    let bottomString = '';

    const chunkCount = renderSamples.length;

    const width = this.width();
    const totalSamples = this.msToSample(this.duration());
    const totalChunks = totalSamples / this.chunkSize();
    const sampleWidth = width / totalChunks;

    for (let i = 0; i < chunkCount; i++) {
      const initialPoint = renderSamples[i];

      const high = this.convertAmplitudeToPx(initialPoint[0]);
      const low = this.convertAmplitudeToPx(initialPoint[1]);

      const x = sampleWidth * i;

      const highPoint = `${x} ${high}`;
      const lowPoint = `${x} ${low}`;

      convertedData += `${highPoint},`;
      bottomString = lowPoint + ',' + bottomString;

      if (i === 0) bottomString = bottomString.slice(0, -1);
    }

    return convertedData + bottomString;
  }

  totalSamples() {
    return this.endSample() - this.beginningSample();
  }

  msToSample(ms) {
    const samplesPerMs = this.sampleRate() / 1000;

    return ms * samplesPerMs;
  }

  samplesPerMs() {
    return this.sampleRate() * 1000;
  }

  duration() {
    return this.endMs() - this.beginningMs();
  }

  sampleRate() {
    return this.props.buffer.sampleRate;
  }

  width() {
    return this.duration() * ZOOM_RATIO * this.props.zoom;
  }

  beginningMs() {
    return this.props.startMs || 0;
  }

  endMs() {
    return this.props.endMs || this.props.buffer.duration * 1000;
  }

  beginningSample() {
    const { startMs } = this.props;

    return startMs ? Math.floor(this.msToSample(startMs)) : 0;
  }

  endSample() {
    const { buffer, endMs } = this.props;

    return endMs ? Math.ceil(this.msToSample(endMs)) : buffer.length;
  }

  async downsample() {
    const beginningSample = this.beginningSample();
    const endSample = this.endSample();

    const samples = this.props.buffer.getChannelData(0);

    const chunkSamples = [[0, 0]];
    const chunkSize = this.chunkSize();

    for (let sample = beginningSample; sample <= endSample; sample++) {
      const i = sample - beginningSample;
      // const chunkNum = Math.floor(i / CHUNK_SIZE);
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

    this.renderSamples = chunkSamples;
    this.forceUpdate();
  }

  render() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: this.width(), height: HEIGHT }}
      >
        <polygon
          points={this.points()}
          fill="cyan"
          stroke="#37b1c6"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
}
