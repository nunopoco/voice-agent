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
      
      // Check if Retell service is available
      const isServiceAvailable = await checkRetellServiceAvailability();
      
      if (isServiceAvailable) {
        // Initialize Retell Web Client
        initRetellClient();
      } else {
        // Show service unavailable message
        showServiceUnavailableMessage();
      }
      
      // Load uploaded files
      loadUploadedFiles();
      
      // Set up event listeners
      setupEventListeners();
    } catch (error) {
      console.error('Error initializing app:', error);
      updateStatus('Failed to initialize. Please refresh the page.', 'error');
    }
  }
  
  async function checkRetellServiceAvailability() {
    try {
      // Try to ping the Retell service through our server
      const response = await fetch('/api/check-service', { 
        method: 'GET',
        credentials: 'include'
      });
      
      // If the response is not ok, the service is unavailable
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.available === true;
    } catch (error) {
      console.error('Error checking Retell service:', error);
      return false;
    }
  }
  
  function initRetellClient() {
    try {
      // Create a new Retell client
      retellWebClient = new RetellWebClient();
      setupRetellEventListeners();
    } catch (error) {
      console.error('Error initializing Retell client:', error);
      showServiceUnavailableMessage();
    }
  }
  
  function showServiceUnavailableMessage(details = 'The voice service is currently unavailable. Please try again later.') {
    // Hide the voice button
    voiceButton.classList.add('hidden');
    
    // Remove any existing service unavailable message
    const existingMessage = document.querySelector('.service-unavailable');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Create and show service unavailable message
    const serviceMessage = document.createElement('div');
    serviceMessage.className = 'service-unavailable';
    serviceMessage.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <p>Voice Service Unavailable</p>
      <p class="service-unavailable-details">${details}</p>
    `;
    
    // Add retry button
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Try Again';
    retryButton.className = 'button';
    retryButton.style.marginTop = '15px';
    retryButton.addEventListener('click', async () => {
      // Remove the message
      serviceMessage.remove();
      
      // Show loading state
      updateStatus('Checking service availability...', 'info');
      
      // Check service availability again
      const isAvailable = await checkRetellServiceAvailability();
      
      if (isAvailable) {
        // Show the voice button
        voiceButton.classList.remove('hidden');
        
        // Initialize Retell client
        initRetellClient();
        
        // Update status
        updateStatus('Service is now available', 'success');
        
        // Reset status after a delay
        setTimeout(() => {
          updateStatus('Tap to start call');
        }, 3000);
      } else {
        // Show unavailable message again
        showServiceUnavailableMessage('The voice service is still unavailable. Please try again later.');
      }
    });
    serviceMessage.appendChild(retryButton);
    
    // Insert the message in place of the button
    voiceButton.parentNode.insertBefore(serviceMessage, voiceButton);
    
    // Update status
    updateStatus('Voice service unavailable', 'error');
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
      
      // Play sound when AI is speaking
      playAISound();
    });
    
    // When agent stops talking
    retellWebClient.on("agent_stop_talking", () => {
      console.log("Agent stopped talking");
      waveContainer.classList.add('hidden');
      updateStatus("Listening...");
      
      // Stop the audio when AI stops speaking
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
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
      
      // Get call token from server
      const response = await fetch('/api/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        // Check if it's a service unavailable error
        if (response.status === 503) {
          showServiceUnavailableMessage();
          return;
        }
        throw new Error('Failed to get call token');
      }
      
      const { callId } = await response.json();
      
      // Start the call with Retell
      const success = await retellWebClient.startCall({
        callId: callId,
        // Optional parameters for customization
        audio: {
          microphoneDeviceId: 'default',
          speakerDeviceId: 'default',
        }
      });
      
      if (!success) {
        throw new Error('Failed to start call');
      }
      
      // Update UI
      voiceButton.classList.add('active');
      voiceButton.querySelector('i').className = 'fas fa-phone-slash';
      updateStatus('Call active');
      
      // Save conversation start to database
      saveConversation("Call started", "system");
      
    } catch (error) {
      console.error('Error starting call:', error);
      
      // Check if the error is related to service unavailability
      if (error.message && (
          error.message.includes('service unavailable') || 
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('failed to fetch')
        )) {
        showServiceUnavailableMessage();
      } else {
        updateStatus('Failed to start call: ' + error.message, 'error');
      }
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
      // Use local sound file
      audioPlayer.src = 'sounds/wave-sound.mp3';
      audioPlayer.volume = 0.3; // Lower volume
      audioPlayer.loop = true; // Loop the sound while AI is speaking
      
      // Play the sound and handle any errors
      audioPlayer.play()
        .then(() => console.log('Playing AI sound'))
        .catch(e => {
          console.error('Could not play sound:', e);
          // Try to autoplay with user interaction
          document.addEventListener('click', function audioPlayHandler() {
            audioPlayer.play();
            document.removeEventListener('click', audioPlayHandler);
          }, { once: true });
        });
    } catch (error) {
      console.error('Could not play AI sound:', error);
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