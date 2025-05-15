// Retell Web Client SDK - Using official Retell SDK via CDN
// We'll use a script tag to load the SDK
let RetellSDK;

// Create a wrapper class that uses the official Retell SDK
export class RetellWebClient {
  constructor() {
    this.connected = false;
    this.isAgentTalking = false;
    this.client = null;
    this.sdkLoaded = false;
    this.initPromise = this.loadSDK();
  }
  
  async loadSDK() {
    return new Promise((resolve, reject) => {
      try {
        // Check if the SDK is already loaded
        if (window.RetellWebClient) {
          console.log("RetellWebClient SDK already loaded");
          RetellSDK = window.RetellWebClient;
          this.client = new RetellSDK();
          this.sdkLoaded = true;
          resolve();
          return;
        }
        
        // Load the SDK script
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/retell-client-js-sdk@latest/dist/index.umd.js';
        script.onload = () => {
          console.log('Retell SDK loaded successfully from CDN');
          RetellSDK = window.RetellWebClient;
          this.client = new RetellSDK();
          this.sdkLoaded = true;
          resolve();
        };
        script.onerror = (error) => {
          console.error('Failed to load Retell SDK from CDN:', error);
          
          // Try loading from local path as fallback
          console.log('Trying to load Retell SDK from local path...');
          const localScript = document.createElement('script');
          localScript.src = '/node_modules/retell-client-js-sdk/dist/index.umd.js';
          
          localScript.onload = () => {
            console.log('Retell SDK loaded successfully from local path');
            RetellSDK = window.RetellWebClient;
            this.client = new RetellSDK();
            this.sdkLoaded = true;
            resolve();
          };
          
          localScript.onerror = (localError) => {
            console.error('Failed to load Retell SDK from local path:', localError);
            reject(new Error('Failed to load Retell SDK from both CDN and local path'));
          };
          
          document.head.appendChild(localScript);
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading RetellWebClient SDK:", error);
        reject(error);
      }
    });
  }

  async startCall({ accessToken, captureDeviceId = 'default', playbackDeviceId = 'default', sampleRate = 16000 }) {
    try {
      console.log('RetellWebClient: Starting call with access token');
      
      // Wait for SDK to load if it hasn't already
      if (!this.sdkLoaded) {
        console.log('RetellWebClient: Waiting for SDK to load...');
        await this.initPromise;
        console.log('RetellWebClient: SDK loaded, proceeding with call');
      }
      
      // First, explicitly request microphone permission
      try {
        console.log('RetellWebClient: Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('RetellWebClient: Microphone permission granted!');
        
        // Stop the stream immediately - we just needed the permission
        stream.getTracks().forEach(track => track.stop());
      } catch (micError) {
        console.error('RetellWebClient: Microphone permission denied:', micError);
        throw new Error('Microphone permission denied. Please allow microphone access in your browser settings and try again.');
      }
      
      // Log the parameters for debugging
      console.log('RetellWebClient: Call parameters:', {
        accessToken: accessToken ? 'token-provided' : 'no-token',
        captureDeviceId,
        playbackDeviceId,
        sampleRate
      });
      
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
      
      // Check if it's a permission error
      if (error.name === 'NotAllowedError' || 
          (error.message && error.message.includes('Permission')) ||
          (error.message && error.message.includes('permission'))) {
        console.error('RetellWebClient: Microphone permission denied');
        throw new Error('Microphone permission denied. Please allow microphone access in your browser settings and try again.');
      }
      
      // Check if it's a security error (often related to HTTPS requirements)
      if (error.name === 'SecurityError') {
        console.error('RetellWebClient: Security error - microphone access may require HTTPS');
        throw new Error('Security error: Microphone access may require HTTPS. Please use a secure connection.');
      }
      
      this.stopCall();
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  async stopCall() {
    try {
      console.log('RetellWebClient: Stopping call');
      
      // Wait for SDK to load if it hasn't already
      if (!this.sdkLoaded) {
        try {
          await this.initPromise;
        } catch (error) {
          console.error('RetellWebClient: SDK failed to load, cannot stop call:', error);
          return false;
        }
      }
      
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
  async on(event, callback) {
    // Wait for SDK to load if it hasn't already
    if (!this.sdkLoaded) {
      try {
        await this.initPromise;
      } catch (error) {
        console.error(`RetellWebClient: SDK failed to load, cannot register ${event} event:`, error);
        return;
      }
    }
    
    if (this.client) {
      return this.client.on(event, callback);
    }
  }
  
  // Forward event listener removal to the SDK client
  async off(event, callback) {
    // Wait for SDK to load if it hasn't already
    if (!this.sdkLoaded) {
      try {
        await this.initPromise;
      } catch (error) {
        console.error(`RetellWebClient: SDK failed to load, cannot unregister ${event} event:`, error);
        return;
      }
    }
    
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
