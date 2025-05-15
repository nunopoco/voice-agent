// Retell Web Client SDK - Using official Retell SDK
import { RetellWebClient as RetellSDK } from "https://cdn.jsdelivr.net/npm/retell-client-js-sdk@latest/dist/index.js";

// Create a wrapper class that uses the official Retell SDK
export class RetellWebClient {
  constructor() {
    // Create the official Retell SDK client
    this.client = new RetellSDK();
    this.connected = false;
    this.isAgentTalking = false;
    
    // Log initialization
    console.log("RetellWebClient initialized with official Retell SDK");
  }

  async startCall({ accessToken, captureDeviceId = 'default', playbackDeviceId = 'default', sampleRate = 16000 }) {
    try {
      console.log('RetellWebClient: Starting call with access token');
      
      // Start the call using the official SDK
      await this.client.startCall({
        accessToken: accessToken,
        captureDeviceId: captureDeviceId,
        playbackDeviceId: playbackDeviceId,
        sampleRate: sampleRate,
        // Don't emit raw audio samples to save bandwidth
        emitRawAudioSamples: false
      });
      
      this.connected = true;
      console.log('RetellWebClient: Call started successfully with official SDK');
      return true;
    } catch (error) {
      console.error('RetellWebClient: Error starting call:', error);
      this.stopCall();
      return false;
    }
  }

  stopCall() {
    try {
      console.log('RetellWebClient: Stopping call');
      
      // Stop the call using the official SDK
      if (this.client) {
        this.client.stopCall();
      }
      
      this.connected = false;
      this.isAgentTalking = false;
      console.log('RetellWebClient: Call stopped successfully');
      return true;
    } catch (error) {
      console.error('RetellWebClient: Error stopping call:', error);
      return false;
    }
  }
  
  // Forward event listener registration to the SDK client
  on(event, callback) {
    if (this.client) {
      return this.client.on(event, callback);
    }
  }
  
  // Forward event listener removal to the SDK client
  off(event, callback) {
    if (this.client) {
      return this.client.off(event, callback);
    }
  }
  
  // These methods are not needed with the official SDK but kept for compatibility
  mute() {
    console.log('RetellWebClient: Mute functionality is handled by the official SDK');
  }

  unmute() {
    console.log('RetellWebClient: Unmute functionality is handled by the official SDK');
  }
}