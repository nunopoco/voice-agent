document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const voiceButton = document.getElementById('voice-button');
  const voiceStatus = document.querySelector('.voice-status');
  const waveContainer = document.getElementById('wave-container');
  const fileInput = document.getElementById('file-input');
  const fileList = document.getElementById('file-list');
  const audioPlayer = document.getElementById('audio-player');
  
  // State variables
  let userId = null;
  let isCallActive = false;
  let retellWebClient = null;
  
  // Initialize the app
  init();
  
  async function init() {
    try {
      // Get or create user ID
      const response = await fetch('/api/user', { credentials: 'include' });
      const data = await response.json();
      userId = data.userId;
      
      // Initialize Retell Web Client
      initRetellClient();
      
      // Load uploaded files
      loadUploadedFiles();
      
      // Set up event listeners
      setupEventListeners();
    } catch (error) {
      console.error('Error initializing app:', error);
      updateStatus('Failed to initialize. Please refresh the page.', 'error');
    }
  }
  
  function initRetellClient() {
    try {
      // Check if RetellWebClient is available
      if (typeof RetellWebClient !== 'undefined') {
        retellWebClient = new RetellWebClient();
        setupRetellEventListeners();
      } else {
        console.warn('RetellWebClient not available. Running in demo mode.');
        // Create a mock client for demo purposes
        retellWebClient = createMockRetellClient();
      }
    } catch (error) {
      console.error('Error initializing Retell client:', error);
      updateStatus('Retell client initialization failed. Running in demo mode.', 'error');
      retellWebClient = createMockRetellClient();
    }
  }
  
  function createMockRetellClient() {
    // Create a mock client for demo purposes
    return {
      startCall: async () => {
        console.log('Mock: Starting call');
        setTimeout(() => {
          mockCallStarted();
        }, 1000);
        return true;
      },
      stopCall: () => {
        console.log('Mock: Stopping call');
        setTimeout(() => {
          mockCallEnded();
        }, 500);
      },
      on: (event, callback) => {
        console.log(`Mock: Registered event listener for ${event}`);
        // Store callbacks for mock events
        if (!window.mockCallbacks) {
          window.mockCallbacks = {};
        }
        window.mockCallbacks[event] = callback;
      }
    };
  }
  
  function mockCallStarted() {
    if (window.mockCallbacks && window.mockCallbacks.call_started) {
      window.mockCallbacks.call_started();
    }
    
    // Simulate agent talking after a delay
    setTimeout(() => {
      if (window.mockCallbacks && window.mockCallbacks.agent_start_talking) {
        window.mockCallbacks.agent_start_talking();
      }
      
      // Simulate agent stopping talking after a delay
      setTimeout(() => {
        if (window.mockCallbacks && window.mockCallbacks.agent_stop_talking) {
          window.mockCallbacks.agent_stop_talking();
        }
      }, 3000);
    }, 1500);
  }
  
  function mockCallEnded() {
    if (window.mockCallbacks && window.mockCallbacks.call_ended) {
      window.mockCallbacks.call_ended();
    }
  }
  
  function setupRetellEventListeners() {
    retellWebClient.on("call_started", () => {
      console.log("Call started");
      isCallActive = true;
      updateStatus("Call started");
    });
    
    retellWebClient.on("call_ended", () => {
      console.log("Call ended");
      isCallActive = false;
      waveContainer.classList.add('hidden');
      updateStatus("Call ended");
      
      // Reset button state
      voiceButton.classList.remove('active');
      voiceButton.querySelector('i').className = 'fas fa-microphone';
      
      // Save conversation end to database
      saveConversation("Call ended", "system");
    });
    
    // When agent starts talking
    retellWebClient.on("agent_start_talking", () => {
      console.log("Agent started talking");
      waveContainer.classList.remove('hidden');
      updateStatus("AI is speaking...");
      
      // Play sound when AI is speaking (optional)
      playAISound();
    });
    
    // When agent stops talking
    retellWebClient.on("agent_stop_talking", () => {
      console.log("Agent stopped talking");
      waveContainer.classList.add('hidden');
      updateStatus("Listening...");
    });
    
    // Update message such as transcript
    retellWebClient.on("update", (update) => {
      console.log("Update received:", update);
      if (update.transcript) {
        // Save transcript to database
        saveConversation(update.transcript, "transcript");
      }
    });
    
    retellWebClient.on("error", (error) => {
      console.error("An error occurred:", error);
      updateStatus("Error: " + error.message, "error");
      
      // Stop the call
      if (isCallActive) {
        retellWebClient.stopCall();
      }
    });
  }
  
  function setupEventListeners() {
    // Voice button click event
    voiceButton.addEventListener('click', toggleCall);
    
    // File input change event
    fileInput.addEventListener('change', handleFileUpload);
  }
  
  async function loadUploadedFiles() {
    try {
      const response = await fetch('/api/uploads', { credentials: 'include' });
      const files = await response.json();
      
      // Clear file list
      fileList.innerHTML = '';
      
      // Display uploaded files
      files.forEach(file => {
        const fileItem = document.createElement('li');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
          <i class="fas fa-file-alt"></i>
          <span>${file.filename}</span>
        `;
        fileList.appendChild(fileItem);
      });
    } catch (error) {
      console.error('Error loading uploaded files:', error);
      updateStatus('Failed to load files', 'error');
    }
  }
  
  async function toggleCall() {
    if (isCallActive) {
      stopCall();
    } else {
      startCall();
    }
  }
  
  async function startCall() {
    try {
      updateStatus('Starting call...');
      
      // Create a web call through our server
      const response = await fetch('/api/create-web-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to create web call');
      }
      
      const createCallResponse = await response.json();
      
      // Start the call with Retell
      await retellWebClient.startCall({
        accessToken: createCallResponse.access_token,
        sampleRate: 24000,
        emitRawAudioSamples: false
      });
      
      // Update UI
      voiceButton.classList.add('active');
      voiceButton.querySelector('i').className = 'fas fa-phone-slash';
      updateStatus('Call active');
      
      // Save conversation start to database
      saveConversation("Call started", "system");
      
    } catch (error) {
      console.error('Error starting call:', error);
      updateStatus('Failed to start call: ' + error.message, 'error');
    }
  }
  
  function stopCall() {
    if (retellWebClient && isCallActive) {
      retellWebClient.stopCall();
      updateStatus('Ending call...');
    }
  }
  
  function playAISound() {
    // Play a sound when AI is speaking (optional)
    // This could be a subtle notification sound
    try {
      audioPlayer.src = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
      audioPlayer.volume = 0.3; // Lower volume
      audioPlayer.play().catch(e => console.log('Could not play sound:', e));
    } catch (error) {
      console.log('Could not play AI sound:', error);
    }
  }
  
  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      updateStatus('Uploading file...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('File upload failed');
      }
      
      const result = await response.json();
      
      // Save message to database
      const message = `File uploaded: ${result.filename}`;
      await saveConversation(message, 'user');
      
      // Reload uploaded files
      loadUploadedFiles();
      
      // Clear file input
      fileInput.value = '';
      
      updateStatus(`File uploaded: ${result.filename}`, 'success');
      
      // Reset status after a delay
      setTimeout(() => {
        updateStatus(isCallActive ? 'Call active' : 'Tap to start call');
      }, 3000);
    } catch (error) {
      console.error('Error uploading file:', error);
      updateStatus('Failed to upload file', 'error');
    }
  }
  
  async function saveConversation(message, role) {
    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, role }),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }
  
  function updateStatus(message, type = 'info') {
    voiceStatus.textContent = message;
    
    // Remove all status classes
    voiceStatus.classList.remove('error', 'success', 'info');
    
    // Add appropriate class
    if (type === 'error') {
      voiceStatus.classList.add('error');
    } else if (type === 'success') {
      voiceStatus.classList.add('success');
    } else {
      voiceStatus.classList.add('info');
    }
  }
});