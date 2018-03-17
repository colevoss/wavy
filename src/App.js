import React, { Component } from 'react';
// import { data } from './data';
import Wavy from './Wavy/Container';
import './App.css';

class App extends Component {
  state = {
    audioLoaded: false,
    zoom: 1,
  };

  constructor() {
    super();
    this.adioContext = new AudioContext();

    this.getAdioFile();
  }

  getAdioFile() {
    const request = new XMLHttpRequest();
    request.open('GET', 'adio_file.wav', true);

    request.responseType = 'arraybuffer';

    request.onload = () => {
      this.decodeBuffer(request.response);
    };

    request.send();
  }

  decodeBuffer(buffer) {
    this.adioContext.decodeAudioData(buffer, (decoded) => {
      this.adioBuffer = decoded;

      this.setState(() => ({ audioLoaded: true }));
    });
  }

  render() {
    return (
      <div className="App">
        <input
          type="range"
          min="1"
          max="20"
          step="0.01"
          value={this.state.zoom}
          onChange={(e) => {
            this.setState({ zoom: e.target.value });
          }}
        />
        {this.state.audioLoaded && (
          <React.Fragment>
            <div>
              <Wavy buffer={this.adioBuffer} zoom={this.state.zoom} />
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }
}

export default App;
