// readAloud.js

let recognition;
let isRecording = false;
let selectedSentence = '';

function speakText(text) {
  const speechSynthesis = window.speechSynthesis;
  if (!speechSynthesis) {
    console.error("Speech synthesis not supported");
    return;
  }

  // Cancel any previous speech
  speechSynthesis.cancel();

  // Create a new speech utterance
  const utterance = new SpeechSynthesisUtterance(text);

  // Speak the text
  speechSynthesis.speak(utterance);
}

function initRecognition() {
  recognition = new webkitSpeechRecognition(); // Create speech recognition object
  recognition.continuous = true; // Enable continuous speech recognition
  recognition.interimResults = true; // Enable interim results

  recognition.onstart = function() {
    console.log("Recording started");
    // Add "recording" class to the record button
    document.getElementById('recordButton').classList.add('recording');
  };

  recognition.onend = function() {
    console.log("Recording stopped");
    // Remove "recording" class from the record button
    document.getElementById('recordButton').classList.remove('recording');
    let value = calculateAccuracy(selectedSentence, document.getElementById('textarea').value);
    setAccuracyValue(value);
  };

  recognition.onresult = function(event) {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        appendText(event.results[i][0].transcript);
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    console.log("Interim transcript:", interimTranscript);
  };

  recognition.onerror = function(event) {
    console.error("Speech recognition error:", event.error);
  };
}

function startRecording() {
  if (!recognition) {
    initRecognition();
  }
  recognition.start();
  isRecording = true;
}

function stopRecording() {
  if (recognition && isRecording) {
    recognition.stop();
    isRecording = false;
  }
}

function appendText(text) {
  const textarea = document.querySelector('#textarea');
  textarea.value += text + ' ';
}

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function fetchAndSelectSentence() {
  // Fetch the JSON file and select a random sentence from the "easy" key
  resetAll();
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      const allSentences = [...data.easy, ...data.medium, ...data.hard];
      selectedSentence = allSentences[Math.floor(Math.random() * allSentences.length)];
      speakText(selectedSentence); // Speak the selected sentence
      displayCurrentText(selectedSentence); // Display the current text
      console.log("Selected sentence:", selectedSentence);
    })
    .catch(error => console.error('Error fetching data.json:', error));
}

function displayCurrentText(text) {
  const currentTextElement = document.getElementById('currentText');
  if (currentTextElement) {
    currentTextElement.textContent = text;
    // document.getElementById('currentTextContainer').style.display = 'block';
  } else {
    console.error('Current text element not found in the DOM');
  }
}

function initReadAloud() {
  // Add event listener to the record button
  const recordButton = document.getElementById('recordButton');
  recordButton.addEventListener('click', toggleRecording);

  // Add event listener to the play button to fetch and speak a sentence
  const playButton = document.getElementById('playButton');
  playButton.addEventListener('click', fetchAndSelectSentence);

  const submitButton = document.getElementById('sendButton');
  submitButton.addEventListener('click', updateAccuracy);

  console.log("Read Aloud initialized");
}

document.addEventListener("DOMContentLoaded", function() {
  initReadAloud();
  const toggleButton = document.getElementById('toggleButton');
  toggleButton.addEventListener('click', toggleTextVisibility);
  
  // Set initial state to hidden
  const currentTextContainer = document.getElementById('currentTextContainer');
  currentTextContainer.style.display = 'none';

  // Set initial icon to eye-slash
  const toggleButtonIcon = document.querySelector('#toggleButton i');
  toggleButtonIcon.classList.remove('bi-eye-fill');
  toggleButtonIcon.classList.add('bi-eye-slash-fill');
});

function setAccuracyValue(value) {
  console.log("selected sentence:", selectedSentence);
  console.log("Accuracy:", value);
  const accuracyValueDiv = document.getElementById('accuracy-value');
  accuracyValueDiv.textContent = value;
}

function resetAll() {
  resetAccuracy();
  clearTextarea();
  clearCurrentText();
}

function clearTextarea() {
  document.getElementById('textarea').value = '';
}

function resetAccuracy() {
  setAccuracyValue('0.00');
  document.getElementById('textarea').value = '';
}

function clearCurrentText() {
  const currentTextElement = document.getElementById('currentText');
  if (currentTextElement) {
    currentTextElement.textContent = '';
    document.getElementById('currentTextContainer').style.display = 'none';
  }
}

function updateAccuracy() {
  let value = calculateAccuracy(selectedSentence, document.getElementById('textarea').value);
  setAccuracyValue(value);
}

function calculateAccuracy(selectedSentence, spokenSentence) {
  // Step 1: Convert to lowercase and split into words
  const selectedWords = selectedSentence.toLowerCase().split(/\s+/).filter(Boolean);
  const spokenWords = spokenSentence.toLowerCase().split(/\s+/).filter(Boolean);

  // Step 2: Remove punctuation from words
  const punctuation = /[,.?!;:]/g;
  const filteredSelectedWords = selectedWords.map(word => word.replace(punctuation, ''));
  const filteredSpokenWords = spokenWords.map(word => word.replace(punctuation, ''));

  // Step 3: Calculate accuracy
  let correctCount = 0;
  filteredSpokenWords.forEach((word, index) => {
    if (word === filteredSelectedWords[index]) {
      correctCount++;
    }
  });

  // Avoid division by zero and consider the greater length for normalization
  const maxLength = Math.max(filteredSelectedWords.length, filteredSpokenWords.length);
  if (maxLength === 0) {
    return "0"; // or appropriate handling for cases with no words
  }

  const accuracy = (correctCount / maxLength) * 100;
  return accuracy.toFixed(2);
}

function toggleTextVisibility() {
  const currentTextContainer = document.getElementById('currentTextContainer');
  const toggleButtonIcon = document.querySelector('#toggleButton i');
  
  if (currentTextContainer.style.display === 'none') {
    currentTextContainer.style.display = 'block';
    toggleButtonIcon.classList.remove('bi-eye-slash-fill');
    toggleButtonIcon.classList.add('bi-eye-fill');
  } else {
    currentTextContainer.style.display = 'none';
    toggleButtonIcon.classList.remove('bi-eye-fill');
    toggleButtonIcon.classList.add('bi-eye-slash-fill');
  }
}