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
  let isRecording = false;
  let isProcessing = false;
  let vapiClient = null;
  let mediaRecorder = null;
  let audioChunks = [];
  
  // Initialize the app
  init();
  
  async function init() {
    try {
      // Get or create user ID
      const response = await fetch('/api/user', { credentials: 'include' });
      const data = await response.json();
      userId = data.userId;
      
      // Initialize VAPI client
      initVapiClient();
      
      // Load uploaded files
      loadUploadedFiles();
      
      // Set up event listeners
      setupEventListeners();
    } catch (error) {
      console.error('Error initializing app:', error);
      updateStatus('Failed to initialize. Please refresh the page.', 'error');
    }
  }
  
  function initVapiClient() {
    try {
      // Check if VapiClient is available
      if (typeof VapiClient !== 'undefined') {
        // Initialize VAPI client (replace with your actual API key)
        vapiClient = new VapiClient({
          apiKey: 'your_vapi_api_key' // In a production app, this would be fetched from the server
        });
      } else {
        console.warn('VapiClient not available. Running in demo mode.');
        // Create a mock client for demo purposes
        vapiClient = {
          chat: async (options) => {
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            return {
              text: "This is a demo response. VAPI client is not available in this environment.",
              audio: null
            };
          }
        };
      }
    } catch (error) {
      console.error('Error initializing VAPI client:', error);
      updateStatus('VAPI client initialization failed. Running in demo mode.', 'error');
    }
  }
  
  function setupEventListeners() {
    // Voice button click event
    voiceButton.addEventListener('click', toggleRecording);
    
    // File input change event
    fileInput.addEventListener('change', handleFileUpload);
    
    // Audio player ended event
    audioPlayer.addEventListener('ended', () => {
      waveContainer.classList.add('hidden');
      updateStatus('Tap to speak');
    });
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
  
  async function toggleRecording() {
    if (isProcessing) return; // Prevent actions while processing
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }
  
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      
      mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
      });
      
      mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await processAudio(audioBlob);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      });
      
      // Start recording
      mediaRecorder.start();
      isRecording = true;
      
      // Update UI
      voiceButton.classList.add('active');
      voiceButton.querySelector('i').className = 'fas fa-stop';
      updateStatus('Listening...');
    } catch (error) {
      console.error('Error starting recording:', error);
      updateStatus('Microphone access denied', 'error');
    }
  }
  
  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      isProcessing = true;
      
      // Update UI
      voiceButton.classList.remove('active');
      voiceButton.querySelector('i').className = 'fas fa-microphone';
      updateStatus('Processing...');
    }
  }
  
  async function processAudio(audioBlob) {
    try {
      // Save user message to database (we don't know the content, but we can mark that audio was sent)
      const userMessage = 'Audio message sent';
      await saveConversation(userMessage, 'user');
      
      // Process audio with VAPI
      const response = await vapiClient.chat({
        audio: audioBlob,
        // Additional options like model, etc. would go here
      });
      
      // Get AI response
      const aiMessage = response.text;
      
      // Save AI message to database
      await saveConversation(aiMessage, 'ai');
      
      // Play audio response
      if (response.audio) {
        playAudioResponse(response.audio);
      } else {
        // If no audio response, simulate the wave animation for a few seconds
        waveContainer.classList.remove('hidden');
        updateStatus('AI is responding...');
        
        // Display the text response after a delay
        setTimeout(() => {
          waveContainer.classList.add('hidden');
          isProcessing = false;
          updateStatus(aiMessage.length > 50 ? aiMessage.substring(0, 47) + '...' : aiMessage, 'success');
          
          // Reset status after a delay
          setTimeout(() => {
            updateStatus('Tap to speak');
          }, 5000);
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      isProcessing = false;
      updateStatus('Failed to process audio', 'error');
    }
  }
  
  function playAudioResponse(audioUrl) {
    // Show wave animation
    waveContainer.classList.remove('hidden');
    updateStatus('AI is speaking...');
    
    // Play audio
    audioPlayer.src = audioUrl;
    audioPlayer.play().catch(error => {
      console.error('Error playing audio:', error);
      waveContainer.classList.add('hidden');
      isProcessing = false;
      updateStatus('Failed to play audio', 'error');
    });
    
    // When audio ends
    audioPlayer.onended = () => {
      waveContainer.classList.add('hidden');
      isProcessing = false;
      updateStatus('Tap to speak');
    };
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
        updateStatus('Tap to speak');
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