class ReportService {
  constructor() {
    // Pure JavaScript SVG chart generation - no external libraries needed
    this.chartWidth = 600;
    this.chartHeight = 400;
    this.appName = 'Yelp AI Business Analyzer';
  }

  // Generate SVG chart from data
  async generateChartSVG(chartData) {
    try {
      const { type, data, title } = chartData;
      
      // For simple bar/line charts, generate inline SVG
      if (type === 'bar') {
        return this.generateBarChartSVG(data, title);
      } else if (type === 'line') {
        return this.generateLineChartSVG(data, title);
      }
      
      return '';
    } catch (error) {
      console.error('Chart generation error:', error);
      return `<p><em>Chart could not be generated</em></p>`;
    }
  }

  // Generate simple bar chart SVG
  generateBarChartSVG(data, title) {
    const width = 600;
    const height = 400;
    const padding = 60;
    const barWidth = (width - 2 * padding) / data.length - 10;
    
    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => d.value));
    const scale = (height - 2 * padding) / maxValue;
    
    let bars = '';
    let labels = '';
    
    data.forEach((item, index) => {
      const x = padding + index * (barWidth + 10);
      const barHeight = item.value * scale;
      const y = height - padding - barHeight;
      
      // Bar
      bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#d32323" rx="4"/>`;
      
      // Value label on top of bar
      bars += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="14" fill="#333">${item.value}</text>`;
      
      // X-axis label
      labels += `<text x="${x + barWidth / 2}" y="${height - padding + 20}" text-anchor="middle" font-size="12" fill="#666">${item.label}</text>`;
    });
    
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Title -->
        <text x="${width / 2}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#333">${title}</text>
        
        <!-- Y-axis -->
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#ccc" stroke-width="2"/>
        
        <!-- X-axis -->
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#ccc" stroke-width="2"/>
        
        <!-- Bars and labels -->
        ${bars}
        ${labels}
      </svg>
    `;
  }

  // Generate simple line chart SVG
  generateLineChartSVG(data, title) {
    const width = 600;
    const height = 400;
    const padding = 60;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const scaleX = (width - 2 * padding) / (data.length - 1);
    const scaleY = (height - 2 * padding) / maxValue;
    
    // Generate path points
    let pathData = '';
    let points = '';
    let labels = '';
    
    data.forEach((item, index) => {
      const x = padding + index * scaleX;
      const y = height - padding - (item.value * scaleY);
      
      if (index === 0) {
        pathData = `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
      
      // Data points
      points += `<circle cx="${x}" cy="${y}" r="5" fill="#d32323"/>`;
      
      // Value labels
      points += `<text x="${x}" y="${y - 10}" text-anchor="middle" font-size="12" fill="#333">${item.value}</text>`;
      
      // X-axis labels
      labels += `<text x="${x}" y="${height - padding + 20}" text-anchor="middle" font-size="12" fill="#666">${item.label}</text>`;
    });
    
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Title -->
        <text x="${width / 2}" y="30" text-anchor="middle" font-size="18" font-weight="bold" fill="#333">${title}</text>
        
        <!-- Y-axis -->
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#ccc" stroke-width="2"/>
        
        <!-- X-axis -->
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#ccc" stroke-width="2"/>
        
        <!-- Line path -->
        <path d="${pathData}" stroke="#d32323" stroke-width="3" fill="none"/>
        
        <!-- Points and labels -->
        ${points}
        ${labels}
      </svg>
    `;
  }

  // Format shareable HTML report (conversation summary only)
  formatShareableConversation(conversation, businessName) {
    const tldr = this.generateTLDR(conversation.messages);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
    .header { background-color: #d32323; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
    .tldr { background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ff9500; }
    .tldr h2 { margin-top: 0; color: #856404; }
    .tldr ul { margin: 0; padding-left: 20px; }
    .tldr li { margin-bottom: 8px; }
    .content { background-color: white; padding: 20px; border-radius: 8px; }
    .message { margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
    .question { border-left: 4px solid #d32323; }
    .insight { border-left: 4px solid #0073bb; }
    .label { font-weight: bold; color: #d32323; margin-bottom: 5px; }
    .chart-container { margin: 20px 0; text-align: center; background-color: #fafafa; padding: 20px; border-radius: 8px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 ${this.appName}</h1>
    <p>${businessName}</p>
    <p>${new Date(conversation.timestamp).toLocaleDateString()}</p>
  </div>
  
  <div class="tldr">
    <h2>⚡ Key Takeaways</h2>
    <ul>
      ${tldr.map(point => `<li>${point}</li>`).join('\n      ')}
    </ul>
  </div>
  
  <div class="content">
    <h2>Conversation Summary</h2>
    ${conversation.messages.map((msg, idx) => `
      <div class="message ${msg.role === 'user' ? 'question' : 'insight'}">
        <div class="label">${msg.role === 'user' ? '❓ Question' : '💡 Insight'} ${idx + 1}:</div>
        <p>${msg.content}</p>
      </div>
    `).join('')}
  </div>
  
  <div class="footer">
    <p>Generated by ${this.appName}</p>
  </div>
</body>
</html>
    `.trim();

    return html;
  }

  // Format shareable HTML report with priorities
  async formatShareablePriorityReport(conversation, priorities, businessName, additionalNotes = '', charts = []) {
    const tldr = this.generateTLDR(conversation.messages);
    
    // Generate chart SVGs
    let chartsSVG = '';
    if (charts && charts.length > 0) {
      for (const chartData of charts) {
        const svg = await this.generateChartSVG(chartData);
        chartsSVG += `<div class="chart-container">${svg}</div>`;
      }
    }
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
    .header { background-color: #d32323; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
    .tldr { background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ff9500; }
    .tldr h2 { margin-top: 0; color: #856404; }
    .tldr ul { margin: 0; padding-left: 20px; }
    .tldr li { margin-bottom: 8px; }
    .priority-section { background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .priority-item { margin-bottom: 15px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
    .priority-high { border-left: 4px solid #d32323; }
    .priority-medium { border-left: 4px solid #ff9500; }
    .priority-low { border-left: 4px solid #34c759; }
    .priority-label { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
    .action { color: #0073bb; margin-top: 10px; }
    .notes { background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .content { background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .message { margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
    .chart-container { margin: 20px 0; text-align: center; background-color: #fafafa; padding: 20px; border-radius: 8px; overflow-x: auto; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 ${this.appName}</h1>
    <p>${businessName}</p>
    <p>${new Date(conversation.timestamp).toLocaleDateString()}</p>
  </div>
  
  <div class="tldr">
    <h2>⚡ Key Takeaways</h2>
    <ul>
      ${tldr.map(point => `<li>${point}</li>`).join('\n      ')}
    </ul>
  </div>
  
  ${chartsSVG}
  
  <div class="priority-section">
    <h2>🎯 Priorities & Action Items</h2>
    ${priorities.map((item, idx) => `
      <div class="priority-item priority-${item.priority.toLowerCase()}">
        <div class="priority-label">${idx + 1}. [${item.priority.toUpperCase()}] ${item.title}</div>
        <div class="action"><strong>Action:</strong> ${item.action}</div>
      </div>
    `).join('')}
  </div>
  
  ${additionalNotes ? `
    <div class="notes">
      <h3>📝 Additional Notes</h3>
      <p>${additionalNotes.replace(/\n/g, '<br>')}</p>
    </div>
  ` : ''}
  
  <div class="content">
    <h2>Conversation Summary</h2>
    ${conversation.messages.map((msg, idx) => `
      <div class="message">
        <strong>${msg.role === 'user' ? '❓ Question' : '💡 Insight'} ${idx + 1}:</strong>
        <p>${msg.content}</p>
      </div>
    `).join('')}
  </div>
  
  <div class="footer">
    <p>Generated by ${this.appName}</p>
  </div>
</body>
</html>
    `.trim();

    return html;
  }

  // Generate TLDR from conversation
  generateTLDR(messages) {
    // Extract assistant responses (insights)
    const insights = messages
      .filter(msg => msg.role === 'assistant')
      .map(msg => msg.content);
    
    // For now, take first 3-5 key insights
    // In production, you'd use OpenAI to generate actual TLDR
    const tldr = insights.slice(0, Math.min(4, insights.length)).map(insight => {
      // Truncate long insights
      if (insight.length > 150) {
        return insight.substring(0, 150) + '...';
      }
      return insight;
    });
    
    return tldr.length > 0 ? tldr : ['No insights generated yet.'];
  }

  // Extract chart data from conversation (if user asked for graphs)
  extractChartDataFromConversation(messages) {
    // Look for messages that might contain chart data
    const charts = [];
    
    // Example: detect if user asked about ratings over time
    const hasRatingQuery = messages.some(msg => 
      msg.role === 'user' && 
      (msg.content.toLowerCase().includes('plot') || 
       msg.content.toLowerCase().includes('graph') ||
       msg.content.toLowerCase().includes('chart') ||
       msg.content.toLowerCase().includes('trend'))
    );
    
    if (hasRatingQuery) {
      // This would come from actual Yelp data in production
      charts.push({
        type: 'line',
        title: 'Rating Trend Over Time',
        data: [
          { label: '2022', value: 3.8 },
          { label: '2023', value: 4.0 },
          { label: '2024', value: 4.2 },
          { label: '2025', value: 4.5 }
        ]
      });
    }
    
    return charts;
  }
}

module.exports = new ReportService();