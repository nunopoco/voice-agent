// Retell Web Client SDK
import { EventEmitter } from 'https://cdn.jsdelivr.net/npm/eventemitter3@5.0.1/+esm';

export class RetellWebClient extends EventEmitter {
  constructor() {
    super();
    this.room = undefined;
    this.connected = false;
    this.isAgentTalking = false;
  }

  async startCall({ accessToken, captureDeviceId = 'default', playbackDeviceId = 'default', sampleRate = 16000 }) {
    try {
      console.log('RetellWebClient: Starting call with access token');
      
      // Simulate successful call start
      this.connected = true;
      this.emit('call_started');
      
      // Simulate agent talking after a short delay
      setTimeout(() => {
        this.isAgentTalking = true;
        this.emit('agent_start_talking');
        
        // Simulate agent stopping talking after 5 seconds
        setTimeout(() => {
          this.isAgentTalking = false;
          this.emit('agent_stop_talking');
          
          // Emit a transcript update
          this.emit('update', {
            transcript: 'Hello, how can I help you today?'
          });
        }, 5000);
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('RetellWebClient: Error starting call', error);
      this.emit('error', 'Error starting call: ' + error.message);
      this.stopCall();
      return false;
    }
  }

  async startAudioPlayback() {
    try {
      console.log('RetellWebClient: Starting audio playback');
      return true;
    } catch (error) {
      console.error('RetellWebClient: Error starting audio playback', error);
      return false;
    }
  }

  stopCall() {
    if (this.connected) {
      console.log('RetellWebClient: Stopping call');
      this.connected = false;
      this.emit('call_ended');
      this.isAgentTalking = false;
    }
  }

  mute() {
    if (this.connected) {
      console.log('RetellWebClient: Muting microphone');
    }
  }

  unmute() {
    if (this.connected) {
      console.log('RetellWebClient: Unmuting microphone');
    }
  }
}