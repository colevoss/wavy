import React from 'react';
import WavyManager from './WavyManager';
import Color from 'color';

export default class Wavy extends React.Component {
  constructor(props) {
    super(props);

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

  componentWillReceiveProps(nextProps) {
    this.manager.update({ zoom: nextProps.zoom, height: nextProps.height });
  }

  colorDark(selected = false) {
    return this.color
      .darken(0.5)
      .rgb()
      .string();
  }

  colorMed(selected = false) {
    return this.color
      .darken(0.33)
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

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        style={{ width: this.manager.width(), height: this.manager.height }}
      >
        <defs>
          <clipPath id="selectedmask" width="300" height={this.manager.height}>
            <rect width="300" height={this.manager.height} />
          </clipPath>
        </defs>

        <g>
          <rect
            width={this.manager.width()}
            height={this.manager.height}
            fill={this.colorLight()}
          />
          <polygon
            id="waveform"
            points={pointsString}
            fill={this.colorMed()}
            stroke={this.colorDark()}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>

        <g clipPath="url(#selectedmask)">
          <rect
            width={this.manager.width()}
            height={this.manager.height}
            fill={this.colorDark()}
          />
          <polygon
            id="waveform"
            points={pointsString}
            fill={this.colorLight()}
            stroke={this.colorExtraLight()}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    );
  }
}
