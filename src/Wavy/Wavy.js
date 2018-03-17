import React from 'react';
import WavyManager from './WavyManager';

export default class Wavy extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      realZoom: props.zoom,
      version: 1,
    };

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

  render() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: this.manager.width(), height: this.manager.height }}
      >
        <polygon
          points={this.manager.svgData()}
          fill="cyan"
          stroke="#37b1c6"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
}
