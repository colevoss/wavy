import React, { Component } from 'react';
// import { data } from './data';
import Wavy from './Wavy/Wavy';
import './App.css';

class App extends Component {
  state = {
    audioLoaded: false,
    zoom: 10,
    startMs: 0,
    endMs: null,
    height: 100,
  };

  constructor() {
    super();
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.adioContext = new AudioContext();

    this.getAdioFile();
  }

  getAdioFile() {
    const request = new XMLHttpRequest();
    request.open('GET', 'adio_file5.wav', true);

    request.responseType = 'arraybuffer';

    console.time('Download');
    request.onload = () => {
      this.decodeBuffer(request.response);
      console.timeEnd('Download');
    };

    request.send();
  }

  decodeBuffer(buffer) {
    this.adioContext.decodeAudioData(
      buffer,
      (decoded) => {
        this.adioBuffer = decoded;

        this.setState(() => ({
          audioLoaded: true,
          endMs: this.adioBuffer.duration * 1000,
        }));
      },
      (error) => {
        console.log(error);
      },
    );
  }

  render() {
    return (
      <div className="App">
        <label>
          Zooom
          <input
            type="range"
            min="100"
            max="1000"
            step="0.01"
            value={this.state.zoom}
            onChange={(e) => {
              this.setState({ zoom: e.target.value });
            }}
          />
        </label>

        <label>
          Start Ms
          <input
            type="range"
            min="0"
            max="40000"
            step="1"
            value={this.state.startMs}
            onChange={(e) => {
              this.setState({ startMs: e.target.value });
            }}
          />
        </label>

        <label>
          End Ms
          <input
            type="range"
            min="0"
            max={this.adioBuffer != null ? this.adioBuffer.duration * 1000 : 0}
            step="1"
            value={this.state.endMs || 0}
            onChange={(e) => {
              this.setState({ endMs: e.target.value });
            }}
          />
        </label>

        <label>
          Height
          <input
            type="range"
            min="100"
            max="500"
            step="10"
            value={this.state.height}
            onChange={(e) => {
              this.setState({ height: e.target.value });
            }}
          />
        </label>
        {this.state.audioLoaded && (
          <React.Fragment>
            <div>
              <Wavy
                color="#00FFFF"
                buffer={this.adioBuffer}
                height={this.state.height}
                startMs={this.state.startMs}
                endMs={this.state.endMs}
                selectedMsStart={4000}
                selectedMsEnd={5000}
                zoom={this.state.zoom}
              />
            </div>
            <div>
              <Wavy
                buffer={this.adioBuffer}
                height={this.state.height}
                startMs={this.state.startMs}
                endMs={this.state.endMs}
                zoom={this.state.zoom}
                color="#ff0000"
              />
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }
}

export default App;
