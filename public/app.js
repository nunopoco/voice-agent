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
      
      // Preload audio
      preloadAudio();
      
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
  
  function preloadAudio() {
    // Preload the audio file
    console.log('Preloading audio...');
    audioPlayer.src = 'sounds/wave-sound.mp3';
    audioPlayer.load();
    audioPlayer.volume = 0.3;
    audioPlayer.loop = true;
    
    // Add event listeners for audio
    audioPlayer.addEventListener('canplaythrough', () => {
      console.log('Audio is ready to play');
    });
    
    audioPlayer.addEventListener('error', (e) => {
      console.error('Audio error:', e);
    });
    
    // Enable audio on first user interaction (to bypass autoplay restrictions)
    document.addEventListener('click', function enableAudio() {
      // Create and play a silent audio to enable audio
      const silentAudio = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV');
      silentAudio.play().catch(e => console.log('Silent audio play failed:', e));
      document.removeEventListener('click', enableAudio);
    }, { once: true });
  }
  
  function initRetellClient() {
    try {
      // Always use demo mode since Retell account requires payment
      console.warn('Using demo mode due to Retell account quota limitations.');
      retellWebClient = createMockRetellClient();
      setupRetellEventListeners();
    } catch (error) {
      console.error('Error initializing mock client:', error);
      updateStatus('Client initialization failed.', 'error');
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
      console.log('Mock: Agent starts talking');
      if (window.mockCallbacks && window.mockCallbacks.agent_start_talking) {
        window.mockCallbacks.agent_start_talking();
      }
      
      // Simulate transcript update
      setTimeout(() => {
        if (window.mockCallbacks && window.mockCallbacks.update) {
          window.mockCallbacks.update({
            transcript: "Hello! I'm your AI assistant. How can I help you today?"
          });
        }
      }, 1000);
      
      // Simulate agent stopping talking after a delay
      setTimeout(() => {
        console.log('Mock: Agent stops talking');
        if (window.mockCallbacks && window.mockCallbacks.agent_stop_talking) {
          window.mockCallbacks.agent_stop_talking();
        }
        
        // Simulate user response and another AI response
        setTimeout(() => {
          // Simulate user speaking
          saveConversation("User is speaking...", "user");
          
          // Simulate AI response
          setTimeout(() => {
            console.log('Mock: Agent starts talking again');
            if (window.mockCallbacks && window.mockCallbacks.agent_start_talking) {
              window.mockCallbacks.agent_start_talking();
            }
            
            // Simulate transcript update
            setTimeout(() => {
              if (window.mockCallbacks && window.mockCallbacks.update) {
                window.mockCallbacks.update({
                  transcript: "I understand. I can help you with that. Is there anything specific you'd like to know?"
                });
              }
            }, 1000);
            
            // Simulate agent stopping talking after a delay
            setTimeout(() => {
              console.log('Mock: Agent stops talking again');
              if (window.mockCallbacks && window.mockCallbacks.agent_stop_talking) {
                window.mockCallbacks.agent_stop_talking();
              }
              
              // Add a third response for better demo
              setTimeout(() => {
                // Simulate user speaking again
                saveConversation("User asks another question...", "user");
                
                // Simulate final AI response
                setTimeout(() => {
                  console.log('Mock: Agent starts talking final time');
                  if (window.mockCallbacks && window.mockCallbacks.agent_start_talking) {
                    window.mockCallbacks.agent_start_talking();
                  }
                  
                  // Simulate transcript update
                  setTimeout(() => {
                    if (window.mockCallbacks && window.mockCallbacks.update) {
                      window.mockCallbacks.update({
                        transcript: "That's a great question! Let me explain in detail. The sound should be playing while I'm talking, and you should see the wave animation as well."
                      });
                    }
                  }, 1000);
                  
                  // Simulate agent stopping talking after a longer delay
                  setTimeout(() => {
                    console.log('Mock: Agent stops talking final time');
                    if (window.mockCallbacks && window.mockCallbacks.agent_stop_talking) {
                      window.mockCallbacks.agent_stop_talking();
                    }
                  }, 6000);
                }, 2000);
              }, 3000);
            }, 4000);
          }, 2000);
        }, 3000);
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
      
      // Stop the audio when AI stops speaking
      stopAISound();
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
      
      // In demo mode, directly start the mock call
      await retellWebClient.startCall();
      
      // Update UI
      voiceButton.classList.add('active');
      voiceButton.querySelector('i').className = 'fas fa-phone-slash';
      updateStatus('Call active (Demo Mode)');
      
      // Save conversation start to database
      saveConversation("Call started (Demo Mode)", "system");
      
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
    // Play a sound when AI is speaking
    try {
      console.log('Attempting to play AI sound...');
      
      // Make sure the audio source is set
      if (!audioPlayer.src || !audioPlayer.src.includes('wave-sound.mp3')) {
        audioPlayer.src = 'sounds/wave-sound.mp3';
        audioPlayer.load();
      }
      
      // Set audio properties
      audioPlayer.volume = 0.3; // Lower volume
      audioPlayer.loop = true; // Loop the sound while AI is speaking
      
      // Add a visual indicator that sound should be playing
      document.body.classList.add('sound-playing');
      
      // Play the sound and handle any errors
      const playPromise = audioPlayer.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Successfully playing AI sound');
            // Show a notification that sound is playing
            updateStatus('AI is speaking (with sound)', 'info');
          })
          .catch(e => {
            console.error('Could not play sound:', e);
            // Show a notification that sound failed
            updateStatus('AI is speaking (sound muted - click anywhere to enable)', 'info');
            
            // Try to autoplay with user interaction
            const enableSound = () => {
              audioPlayer.play()
                .then(() => {
                  console.log('Sound enabled after user interaction');
                  updateStatus('Sound enabled', 'success');
                })
                .catch(err => console.error('Still could not play sound:', err));
            };
            
            document.addEventListener('click', enableSound, { once: true });
          });
      }
    } catch (error) {
      console.error('Could not play AI sound:', error);
      updateStatus('Sound playback error - try refreshing', 'error');
    }
  }
  
  function stopAISound() {
    try {
      console.log('Stopping AI sound...');
      
      // Pause the audio
      if (!audioPlayer.paused) {
        audioPlayer.pause();
      }
      
      // Reset the audio position
      audioPlayer.currentTime = 0;
      
      // Remove the visual indicator
      document.body.classList.remove('sound-playing');
      
      console.log('AI sound stopped');
    } catch (error) {
      console.error('Error stopping AI sound:', error);
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