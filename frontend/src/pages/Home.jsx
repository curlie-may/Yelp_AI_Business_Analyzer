import { useState, useEffect } from 'react';
import api from '../services/api';
import VoiceInput from '../components/VoiceInput';
import ConversationDisplay from '../components/ConversationDisplay';

function Home({ userId, business, onLogout }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  // Start new conversation on mount or restore existing one
  useEffect(() => {
    const existingConvId = sessionStorage.getItem('conversationId');
    
    if (existingConvId) {
      console.log('Restoring conversation:', existingConvId);
      setConversationId(existingConvId);
    } else {
      startNewConversation();
    }
  }, []);

  const startNewConversation = async () => {
    try {
      const result = await api.startConversation(
        userId,
        business.id,
        business.name
      );
      
      console.log('New conversation started:', result.conversationId);
      setConversationId(result.conversationId);
      sessionStorage.setItem('conversationId', result.conversationId); // Save to sessionStorage
      setMessages([]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleNewMessage = (userMessage, assistantMessage) => {
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantMessage }
    ]);
  };

  return (
    <div className="home-container">
      <div className="header">
        <div className="header-left">
          <h1>{business.name}</h1>
          <p>Voice Intelligence Dashboard</p>
        </div>
        <div>
          <button onClick={onLogout} className="btn-logout">
            Home
          </button>
        </div>
      </div>

      <div className="main-content">
        <ConversationDisplay messages={messages} businessName={business.name} />

        <VoiceInput
          userId={userId}
          conversationId={conversationId}
          onNewMessage={handleNewMessage}
        />
      </div>
    </div>
  );
}

export default Home;