import ShareMenu from './ShareMenu';

function ConversationDisplay({ messages, businessName }) {
    if (messages.length === 0) {
      return null;
    }
  
    return (
      <div className="conversation-container">
        <div className="conversation-header">
          <h2 className="conversation-title">Conversation</h2>
          {messages.length > 0 && <ShareMenu messages={messages} businessName={businessName} />}
        </div>
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-role">
                {message.role === 'user' ? 'YOU' : 'AI ASSISTANT'}
              </div>
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  export default ConversationDisplay;