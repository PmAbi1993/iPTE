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
      console.log("Selected sentence:", selectedSentence);
    })
    .catch(error => console.error('Error fetching data.json:', error));
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
}
function clearTextarea() {
  document.getElementById('textarea').value = '';
}
function resetAccuracy() {
  setAccuracyValue('0.00');
  document.getElementById('textarea').value = '';
}

function updateAccuracy() {
  let value = calculateAccuracy(selectedSentence, document.getElementById('textarea').value);
  setAccuracyValue(value);
}

function calculateAccuracy(selectedSentence, spokenSentence) {
  // Step 1: Get all words from the selected sentence and store in the variable selectedSentence with lowercase
  const selectedWords = selectedSentence.toLowerCase().split(/\s+/);
  
  // Step 2: Get all words from the textArea and store in the variable spokenSentence with lower case
  const spokenWords = spokenSentence.toLowerCase().split(/\s+/);
  
  // Step 3: Filter both selectedSentence and spokenSentence of [“,”, “.”]
  const filteredSelectedWords = selectedWords.map(word => word.replace(/[,.]/g, ''));
  const filteredSpokenWords = spokenWords.map(word => word.replace(/[,.]/g, ''));
  
  // Step 4: calculate accuracy of spokenSentence with regards to selectedSentence
  let correctCount = 0;
  for (let i = 0; i < Math.min(filteredSelectedWords.length, filteredSpokenWords.length); i++) {
      if (filteredSelectedWords[i] === filteredSpokenWords[i]) {
          correctCount++;
      }
  }
  
  const accuracy = (correctCount / filteredSelectedWords.length) * 100;
  return accuracy.toFixed(2);
}