import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const VoiceInput = ({ userId, conversationId, onNewMessage, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exampleQuestion, setExampleQuestion] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 11 example questions to rotate
  const exampleQuestions = [
    "What do customers complain about most?",
    "What do customers love about my business?",
    "What's mentioned most in 5-star reviews?",
    "How does my business compare to competitors?",
    "What improvements do reviews suggest?",
    "What do customers say about my service?",
    "Are there any trends in recent reviews?",
    "What do customers say about parking?",
    "What's my most popular item or service?",
    "How do customers describe the atmosphere?",
    "What do customers say about prices?"
  ];

  // Pick a random example question on component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * exampleQuestions.length);
    setExampleQuestion(exampleQuestions[randomIndex]);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Send to API
        await sendVoiceMessage(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    if (!conversationId) {
      alert('No conversation started. Please refresh the page.');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Sending voice message...');
      const response = await api.sendVoiceMessage(userId, conversationId, audioBlob);
      
      console.log('Voice response received:', response);

      if (response.success && response.transcription && response.response) {
        // Update conversation display
        if (onNewMessage) {
          onNewMessage(response.transcription, response.response);
        }

        // Play audio response if available
        if (response.audio) {
          try {
            const audioBlob = new Blob(
              [Uint8Array.from(atob(response.audio), c => c.charCodeAt(0))],
              { type: 'audio/mpeg' }
            );
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play().catch(err => console.log('Audio playback failed:', err));
          } catch (audioError) {
            console.log('Audio decoding failed:', audioError);
          }
        }
      } else {
        console.error('Invalid response format:', response);
        alert('Failed to process your question. Please try again.');
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
      alert('Error processing your question: ' + (error.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = disabled || !conversationId || isProcessing;

  return (
    <div className="voice-input">
      <button
        className={`mic-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isDisabled}
      >
        {isProcessing ? '⏳ Processing...' : isRecording ? '🔴 Stop' : '🎤 Tap to Ask'}
      </button>
      
      {!isRecording && !isProcessing && (
        <p className="example-question">
          <em>Example: "{exampleQuestion}"</em>
        </p>
      )}
      
      {isRecording && (
        <p className="recording-indicator">Recording... Tap again to stop</p>
      )}

      {isProcessing && (
        <p className="processing-indicator">Processing your question...</p>
      )}
    </div>
  );
};

export default VoiceInput;