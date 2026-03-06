/**
 * Generate a Google Meet link for the appointment
 * 
 * IMPORTANT: This generates Jitsi Meet links as fallback since real Google Meet
 * requires Google Calendar API integration.
 * 
 * For REAL Google Meet links:
 * 1. Set up Google Calendar API (see GOOGLE_MEET_SETUP_GUIDE.md)
 * 2. Call backend API endpoint: /api/appointments/create-meet-link
 * 
 * This function generates working Jitsi Meet links that function identically to Google Meet.
 * Jitsi is free, open-source, and works without any setup or authentication.
 */
export const generateMeetLink = (appointmentId: string): string => {
  // Generate Jitsi Meet link (WORKS IMMEDIATELY)
  // Jitsi Meet allows instant room creation with any room name
  // No authentication or API key required
  const timestamp = Date.now();
  const roomName = `ongogenesis-${appointmentId}-${timestamp}`;
  
  // Add configuration to skip waiting room and allow direct join
  const config = [
    'config.prejoinPageEnabled=false',  // Skip pre-join page
    'config.startWithAudioMuted=false',  // Audio on by default
    'config.startWithVideoMuted=false',  // Video on by default
    'config.requireDisplayName=false'    // Don't require name entry
  ].join('&');
  
  return `https://meet.jit.si/${roomName}#${config}`;
  
  // Option 2: Generate Google Meet-style link (REQUIRES API)
  // Uncomment below to use mock Google Meet links
  // NOTE: These won't work! You'll get "Check your meeting code" error
  // Real Google Meet requires API integration (see GOOGLE_MEET_SETUP_GUIDE.md)
  /*
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const generateSegment = (length: number) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  
  const segment1 = generateSegment(3);
  const segment2 = generateSegment(4);
  const segment3 = generateSegment(3);
  return `https://meet.google.com/${segment1}-${segment2}-${segment3}`;
  */
};

/**
 * Validate if a string is a valid Jitsi Meet link
 */
export const isValidMeetLink = (link: string): boolean => {
  const jitsiPattern = /^https:\/\/meet\.jit\.si\/[\w-]+$/;
  const googleMeetPattern = /^https:\/\/meet\.google\.com\/[\w-]+$/;
  return jitsiPattern.test(link) || googleMeetPattern.test(link);
};


