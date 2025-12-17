import { useState, useRef, useEffect } from 'react';

function ShareMenu({ messages, businessName }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatConversationHTML = () => {
    const timestamp = new Date().toLocaleString();
    
    const messagesHTML = messages.map((msg, idx) => {
      const role = msg.role === 'user' ? '👤 You' : '🤖 AI Assistant';
      const bgColor = msg.role === 'user' ? '#e3f2fd' : '#f5f5f5';
      
      return `
        <div style="margin-bottom: 20px; padding: 15px; background-color: ${bgColor}; border-radius: 8px;">
          <div style="font-size: 12px; font-weight: bold; color: #666; margin-bottom: 8px; text-transform: uppercase;">
            ${role}
          </div>
          <div style="font-size: 15px; line-height: 1.6; color: #333;">
            ${msg.content}
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${businessName} - Conversation Transcript</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .header {
            background-color: #d32323;
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          @media print {
            body {
              background-color: white;
            }
            .header {
              background-color: #d32323 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${businessName}</h1>
          <p>Voice Intelligence Dashboard - Conversation Transcript</p>
          <p>Generated: ${timestamp}</p>
        </div>
        <div class="content">
          ${messagesHTML}
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const html = formatConversationHTML();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
    setIsOpen(false);
  };

  const handleDownload = () => {
    const html = formatConversationHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName.replace(/[^a-z0-9]/gi, '_')}_conversation_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleShare = async () => {
    const text = messages.map(msg => {
      const role = msg.role === 'user' ? 'You' : 'AI Assistant';
      return `${role}: ${msg.content}`;
    }).join('\n\n');

    const shareData = {
      title: `${businessName} - Conversation Transcript`,
      text: text,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(text);
        alert('Conversation copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        alert('Conversation copied to clipboard!');
      } catch (clipboardError) {
        alert('Unable to share. Please use Print or Download instead.');
      }
    }
    setIsOpen(false);
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="share-menu-container" ref={menuRef}>
      <button 
        className="btn-share"
        onClick={() => setIsOpen(!isOpen)}
      >
        📤 Export {isOpen ? '▲' : '▼'}
      </button>

      {isOpen && (
        <div className="share-dropdown">
          <button className="share-option" onClick={handlePrint}>
            🖨️ Print
          </button>
          <button className="share-option" onClick={handleDownload}>
            💾 Download
          </button>
          <button className="share-option" onClick={handleShare}>
            📱 Share
          </button>
        </div>
      )}
    </div>
  );
}

export default ShareMenu;