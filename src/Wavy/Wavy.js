import React from 'react';
import WavyManager from './WavyManager';
import Color from 'color';

let idCount = 1;

export default class Wavy extends React.Component {
  constructor(props) {
    super(props);

    this.id = `waveform-${idCount++}`;

    this.state = {
      realZoom: props.zoom,
      version: 1,
    };

    this.color = Color(props.color);

    this.manager = new WavyManager(
      props.buffer,
      props.zoom,
      props.height,
      props.startMs,
      props.endMs,
      props.selectedMsStart,
      props.selectedMsEnd,
    );

    this.manager.onUpdate(() =>
      this.setState(({ version }) => ({ version: version + 1 })),
    );
  }

  componentDidMount() {
    this.manager.downsample();
  }

  componentWillUnmount() {
    this.manager = null;
  }

  componentWillReceiveProps({
    zoom,
    height,
    startMs,
    endMs,
    selectedMsStart,
    selectedMsEnd,
  }) {
    this.manager.update({
      zoom,
      height,
      startMs,
      endMs,
      selectedMsStart,
      selectedMsEnd,
    });
  }

  colorDark(selected = false) {
    return this.color
      .darken(0.5)
      .rgb()
      .string();
  }

  colorMed(selected = false) {
    return this.color
      .darken(0.25)
      .rgb()
      .string();
  }

  colorLight(selected = false) {
    return this.color
      .lighten(0.5)
      .hsl()
      .string();
  }

  colorExtraLight(selected = false) {
    return this.color
      .lighten(0.66)
      .hsl()
      .string();
  }

  render() {
    const pointsString = this.manager.svgData();
    console.log(pointsString.length);

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        style={{ width: this.manager.width(), height: this.manager.height }}
      >
        {this.manager.hasSelection() && (
          <defs>
            <clipPath
              id={`selected-clip-${this.id}`}
              maskUnits="userSpaceOnUse"
              height={this.manager.height}
            >
              <rect
                x={this.manager.selectedPxStart()}
                width={this.manager.selectedPxEnd()}
                height={this.manager.height}
              />
            </clipPath>
          </defs>
        )}

        <g>
          <rect
            width={this.manager.width()}
            height={this.manager.height}
            fill={this.colorLight()}
            stroke={this.colorMed()}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <polygon
            points={pointsString}
            fill={this.colorMed()}
            stroke={this.colorDark()}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>

        {this.manager.hasSelection() && (
          <g clipPath={`url(#selected-clip-${this.id})`}>
            <rect
              width={this.manager.width()}
              height={this.manager.height}
              fill={this.colorDark()}
            />
            <polygon
              points={pointsString}
              fill={this.colorLight()}
              stroke={this.colorExtraLight()}
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>
    );
  }
}
