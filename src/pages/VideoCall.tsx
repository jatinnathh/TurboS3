import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAppointmentById } from '../services/appointmentService';
import { db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getUserProfile } from '../services/userService';
import type { Appointment } from '../types';
import './VideoCall.css';

interface ChatMessage {
  id: string;
  appointmentId: string;
  senderId: string;
  senderName: string;
  senderType: 'patient' | 'doctor';
  message: string;
  timestamp: Timestamp | Date;
  createdAt?: any;
}

const VideoCall: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [meetLinkCopied, setMeetLinkCopied] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch appointment data
  useEffect(() => {
    const fetchAppointment = async () => {
      if (appointmentId) {
        try {
          const appt = await getAppointmentById(appointmentId);
          setAppointment(appt);
        } catch (error) {
          console.error('Error fetching appointment:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAppointment();
  }, [appointmentId]);

  // Fetch user profile and determine role
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !appointment) return;

      try {
        // Try to get doctor profile first
        let profile = await getUserProfile(user.uid, 'doctor');
        if (profile) {
          setUserProfile(profile);
          setUserRole('doctor');
          return;
        }

        // If not doctor, try patient
        profile = await getUserProfile(user.uid, 'patient');
        if (profile) {
          setUserProfile(profile);
          setUserRole('patient');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user, appointment]);

  // Real-time chat listener
  useEffect(() => {
    if (!appointmentId) return;

    console.log('Setting up chat listener for appointment:', appointmentId);

    const messagesRef = collection(db, 'chatMessages');
    const q = query(
      messagesRef,
      where('appointmentId', '==', appointmentId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('Received messages snapshot, count:', snapshot.size);
        const fetchedMessages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Message data:', data);
          fetchedMessages.push({
            id: doc.id,
            appointmentId: data.appointmentId,
            senderId: data.senderId,
            senderName: data.senderName,
            senderType: data.senderType,
            message: data.message,
            timestamp: data.createdAt || data.timestamp,
            createdAt: data.createdAt
          });
        });
        
        // Sort messages by timestamp in memory
        fetchedMessages.sort((a, b) => {
          const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : new Date(a.timestamp).getTime();
          const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
        
        console.log('Setting messages:', fetchedMessages);
        setMessages(fetchedMessages);
      },
      (error) => {
        console.error('Error listening to messages:', error);
        if (error.code === 'failed-precondition' || error.message.includes('index')) {
          console.error('FIRESTORE INDEX REQUIRED! Check console for the index creation link.');
        }
      }
    );

    return () => unsubscribe();
  }, [appointmentId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !appointment || !appointmentId || !userRole || !userProfile) return;

    try {
      const messageData = {
        appointmentId: appointmentId,
        senderId: user.uid,
        senderName: userProfile.name || (userRole === 'patient' ? appointment.patientName : appointment.doctorName),
        senderType: userRole,
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
        timestamp: new Date()
      };

      await addDoc(collection(db, 'chatMessages'), messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleCopyMeetLink = () => {
    if (appointment?.meetLink) {
      navigator.clipboard.writeText(appointment.meetLink);
      setMeetLinkCopied(true);
      setTimeout(() => setMeetLinkCopied(false), 2000);
    }
  };

  const handleJoinMeet = () => {
    if (appointment?.meetLink) {
      window.open(appointment.meetLink, '_blank');
    }
  };

  const handleBack = () => {
    navigate('/booked-appointments');
  };

  if (loading) {
    return (
      <div className="video-call-container">
        <div className="loading-spinner">Loading appointment...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="video-call-container">
        <div className="error-message">
          <h2>Appointment Not Found</h2>
          <button onClick={handleBack}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-container">
      {/* Header */}
      <div className="video-call-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <div className="appointment-info">
            <h2>Video Consultation</h2>
            <p>Dr. {appointment.doctorName} • {appointment.timeSlot}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="video-call-main">
        {/* Left Side - Chat */}
        <div className="chat-section">
          <div className="chat-header">
            <h3>
              <i className="fas fa-comments"></i> 
              {userRole === 'doctor' ? 'Chat with Patient' : 'Chat with Doctor'}
            </h3>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                // Convert Firestore Timestamp to Date if needed
                const messageTime = msg.timestamp instanceof Timestamp 
                  ? msg.timestamp.toDate() 
                  : new Date(msg.timestamp);
                
                return (
                  <div
                    key={msg.id}
                    className={`message ${msg.senderId === user?.uid ? 'sent' : 'received'}`}
                  >
                    <div className="message-header">
                      <span className="sender-name">{msg.senderName}</span>
                      <span className="message-time">
                        {messageTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="message-content">{msg.message}</div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="chat-input"
            />
            <button type="submit" className="send-button" disabled={!newMessage.trim()}>
              Send
            </button>
          </form>
        </div>

        {/* Right Side - Video Meeting */}
        <div className="meet-section">
          <div className="meet-header">
            <h3><i className="fas fa-video"></i> Video Meeting</h3>
          </div>

          <div className="meet-content">
            <div className="meet-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="80" height="80">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </div>

            <div className="appointment-details">
              <div className="detail-item">
                <span className="label">Doctor:</span>
                <span className="value">Dr. {appointment.doctorName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Patient:</span>
                <span className="value">{appointment.patientName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Time Slot:</span>
                <span className="value">{appointment.timeSlot}</span>
              </div>
              <div className="detail-item">
                <span className="label">Appointment ID:</span>
                <span className="value">{appointment.id}</span>
              </div>
            </div>

            {appointment.meetLink ? (
              <div className="meet-link-section">
                <div className="meet-link-box">
                  <span className="meet-link-label">Video Meeting Link:</span>
                  <div className="meet-link-value">
                    <input
                      type="text"
                      readOnly
                      value={appointment.meetLink}
                      className="meet-link-input"
                    />
                    <button
                      className="copy-link-button"
                      onClick={handleCopyMeetLink}
                      title="Copy link"
                    >
                      {meetLinkCopied ? <i className="fas fa-check"></i> : <i className="fas fa-copy"></i>}
                    </button>
                  </div>
                  {meetLinkCopied && <span className="copied-toast">Link copied!</span>}
                </div>

                <button className="join-meet-button" onClick={handleJoinMeet}>
                  <i className="fas fa-video"></i>
                  Join Video Call
                </button>

                <p className="meet-info">
                  Click the button above to join the video consultation with your doctor.
                  The meeting is hosted on Jitsi Meet, a secure and free video conferencing platform.
                  No account or installation required!
                </p>
              </div>
            ) : (
              <div className="no-meet-link">
                <p>Meeting link is being generated...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;

