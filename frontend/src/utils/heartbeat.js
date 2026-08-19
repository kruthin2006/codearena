import axios from 'axios';

let heartbeatInterval = null;

export function startHeartbeat(token) {
  if (heartbeatInterval) return;
  
  heartbeatInterval = setInterval(async () => {
    try {
      await axios.post(
        'http://localhost:5000/api/admin/heartbeat',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('💓 Heartbeat sent');
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }, 5000);
}

export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('💓 Heartbeat stopped');
  }
}