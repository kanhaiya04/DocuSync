import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
import { WebsocketProvider } from 'y-websocket';
import { io, Socket } from 'socket.io-client';

interface CollaborativeEditorProps {
  roomId: string;
  userId: string;
  userName: string;
  socket?: Socket; // Optional socket prop to use existing connection
  onSave?: (content: string) => void;
  onTitleChange?: (title: string) => void;
  initialContent?: string;
  initialTitle?: string;
  onSocketReady?: (socket: Socket) => void; // Callback to expose socket to parent
  onConnectedUsersChange?: (users: UserPresence[]) => void; // Callback to expose connected users to parent
}

interface UserPresence {
  userId: string;
  userName: string;
  color: string;
  cursor?: {
    position: number;
    selection: { start: number; end: number };
  };
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  roomId,
  userId,
  userName,
  socket: providedSocket,
  onSave,
  onTitleChange,
  initialContent = '',
  initialTitle = '',
  onSocketReady,
  onConnectedUsersChange
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectedUsers, setConnectedUsers] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState<boolean>(false); // Track if Yjs has completed initial sync
  
  const quillRef = useRef<ReactQuill>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<QuillBinding | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const contentSetRef = useRef<boolean>(false); // Track if initial content has been set
  const connectTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track connection timeout
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track sync fallback timeout
  
  const userColors = useMemo(() => ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'], []);
  
  // Use environment variable or default to localhost for development
  const HOST = 'https://docusync-server.onrender.com';
  
  // Construct WebSocket URL based on HTTP URL
  const getWebSocketUrl = () => {
    const wsProtocol = HOST.startsWith('https') ? 'wss:' : 'ws:';
    const hostWithoutProtocol = HOST.replace(/^https?:\/\//, '');
    return `${wsProtocol}//${hostWithoutProtocol}`;
  };

  // Initialize Yjs document and provider
  useEffect(() => {
    if (!roomId || isInitializedRef.current) return;
    
    // Set initialization flag immediately to prevent multiple calls
    isInitializedRef.current = true;
    
    try {
      setError(null);
      setIsLoading(true);
      
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;
      
      // Add update listener for debugging
      ydoc.on('update', (update: Uint8Array) => {
        console.log('Y.Doc updated locally, update size:', update.length, 'bytes');
      });
      
      // Connect to Yjs WebSocket server with correct URL format
      // y-websocket will append roomId to the URL: ws://host/yjs/roomId
      const wsUrl = `${getWebSocketUrl()}/yjs`;
      console.log('Creating Yjs WebSocket connection for room:', roomId, 'URL:', wsUrl);
      const provider = new WebsocketProvider(
        wsUrl,
        roomId,
        ydoc,
        {
          connect: false, // Don't auto-connect immediately
          WebSocketPolyfill: class extends WebSocket {
            constructor(url: string | URL, protocols?: string | string[]) {
              super(url, protocols);
              this.binaryType = 'arraybuffer'; // Ensure binary data handling
            }
          },
          // Remove all reconnection settings to prevent loops
        }
      );
      providerRef.current = provider;
      
      // Connect after a small delay to ensure component is stable
      connectTimeoutRef.current = setTimeout(() => {
        if (providerRef.current === provider) {
          provider.connect();
        }
      }, 100);
      
      // Handle initial sync completion
      provider.on('sync', (isSynced: boolean) => {
        console.log('Yjs provider sync status:', isSynced);
        if (isSynced) {
          setIsSynced(true);
          console.log('✅ Yjs initial sync completed via sync event');
          
          // Log the current Yjs content after sync
          const ytext = ydoc.getText('quill');
          console.log('Yjs content after sync:', ytext.toString().substring(0, 100), 'length:', ytext.toString().length);
        }
      });
      
      // Handle connection status
      provider.on('status', (event: { status: string }) => {
        console.log('Yjs connection status:', event.status);
        setIsConnected(event.status === 'connected');
        if (event.status === 'connected') {
          setIsLoading(false);
          setError(null);
          console.log('Yjs provider connected successfully!');
          
          // Fallback: Set synced to true after a delay if sync event doesn't fire
          // This ensures database content loads even if there are no other users
          syncTimeoutRef.current = setTimeout(() => {
            setIsSynced(true);
            console.log('✅ Yjs sync completed via fallback timeout');
          }, 2000); // Wait 2 seconds for sync to complete, then mark as synced
          
          // ALWAYS try to create binding when connected if it doesn't exist
          setTimeout(() => {
            console.log('Checking if binding needs to be created...');
            if (!bindingRef.current && quillRef.current && ydoc) {
              try {
                const ytext = ydoc.getText('quill');
                const editor = quillRef.current.getEditor();
                console.log('Creating Yjs binding...');
                const binding = new QuillBinding(ytext, editor, provider.awareness);
                bindingRef.current = binding;
                console.log('✅ Yjs binding created successfully!');
                
                // Verify binding is working
                console.log('Quill editor instance:', editor);
                console.log('Yjs text instance:', ytext);
              } catch (err) {
                console.error('❌ Error creating Yjs binding:', err);
              }
            } else {
              console.log('Binding already exists or components not ready:', {
                hasBinding: !!bindingRef.current,
                hasQuill: !!quillRef.current,
                hasYdoc: !!ydoc
              });
            }
          }, 500); // Increased delay to ensure Quill is ready
        } else if (event.status === 'disconnected') {
          setIsLoading(true);
        }
      });
      
      // Handle connection errors
      provider.on('connection-error', (error: any) => {
        console.log('Yjs connection error:', error);
        setError('Failed to connect to collaborative server. Please check if the server is running.');
        setIsLoading(false);
      });
      
      // Handle connection close
      provider.on('connection-close', (event: any) => {
        console.log('Yjs connection closed:', event);
        setIsConnected(false);
        
        // Only show error if connection was closed unexpectedly
        if (event && event.code !== 1000) { // 1000 is normal closure
          setError('Connection to collaborative server lost. Click Retry to reconnect.');
        }
      });
      
      // Binding is now initialized in the 'status' event handler when connected
      // This ensures the binding is created AFTER the provider connects
      
      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        setError('Connection timeout. Please check if the server is running.');
        setIsLoading(false);
      }, 10000); // 10 second timeout
      
      // Clear timeout when connected
      provider.on('status', (event: { status: string }) => {
        if (event.status === 'connected') {
          clearTimeout(connectionTimeout);
        }
      });
      
      return () => {
        clearTimeout(connectionTimeout);
        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
        
        // Clean up binding first
        if (bindingRef.current) {
          try {
            bindingRef.current.destroy();
          } catch (error) {
            console.log('Error destroying binding:', error);
          }
          bindingRef.current = null;
        }
        
        // Disconnect provider before destroying
        if (provider) {
          try {
            provider.disconnect();
          } catch (error) {
            console.log('Error disconnecting provider:', error);
          }
        }
        
        // Clean up provider
        if (provider) {
          try {
            provider.destroy();
          } catch (error) {
            console.log('Error destroying provider:', error);
          }
        }
        
        // Clean up document
        if (ydoc) {
          try {
            ydoc.destroy();
          } catch (error) {
            console.log('Error destroying document:', error);
          }
        }
        
        isInitializedRef.current = false;
        contentSetRef.current = false; // Reset content flag on cleanup
        setIsSynced(false); // Reset sync flag on cleanup
      };
    } catch (error) {
      console.error('Error initializing Yjs:', error);
      setError('Failed to initialize collaborative editing');
      setIsLoading(false);
    }
  }, [roomId, initialContent]);

  // Initialize Socket.io for presence and chat
  useEffect(() => {
    if (!roomId) return;
    
    let socketConnectTimeout: NodeJS.Timeout | null = null;
    
    // Use provided socket or create new one if none provided
    const socket = providedSocket || io(HOST, {
      autoConnect: false, // Don't auto-connect to prevent early disconnection
      reconnection: false, // Disable reconnection to prevent loops
      transports: ['websocket', 'polling']
    });
    
    socketRef.current = socket;
    
    // Connect after a delay to ensure component is stable
    if (!providedSocket) {
      socketConnectTimeout = setTimeout(() => {
        if (socketRef.current === socket) {
          socket.connect();
        }
      }, 150);
    } else {
      // If using provided socket, it should already be connected
      if (!socket.connected) {
        socket.connect();
      }
    }
    
    const handleConnect = () => {
      console.log('Socket connected:', socket.id);
      console.log('Joining room:', roomId);
      console.log('User name being sent:', userName);
      socket.emit('join-room', {
        roomId: roomId,
        userName: userName
      });
      
      // Notify parent component that socket is ready
      if (onSocketReady) {
        onSocketReady(socket);
      }
    };
    
    const handleConnectError = (error: any) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to presence server');
    };
    
    const handleUserJoined = (data: { userId: string; userName: string; timestamp: number }) => {
      // Only add other users, not ourselves
      if (data.userId !== socket.id) {
        setConnectedUsers(prev => {
          const userExists = prev.some(user => user.userId === data.userId);
          if (!userExists) {
            return [...prev, {
              userId: data.userId,
              userName: data.userName,
              color: userColors[Math.floor(Math.random() * userColors.length)]
            }];
          }
          return prev;
        });
      }
    };

    const handleExistingUsers = (users: Array<{ userId: string; userName: string; timestamp: number }>) => {
      console.log('Received existing users:', users);
      setConnectedUsers(prev => {
        // Clear existing users and set the new list to avoid duplicates
        // This ensures we have the correct state from the server
        const newUsers = users.map(user => ({
          userId: user.userId,
          userName: user.userName,
          color: userColors[Math.floor(Math.random() * userColors.length)]
        }));
        return newUsers;
      });
    };
    
    const handleUserLeft = (data: { userId: string; timestamp: number }) => {
      setConnectedUsers(prev => prev.filter(user => user.userId !== data.userId));
    };
    
    const handleCursorPosition = (data: { userId: string; position: number; selection: any }) => {
      setConnectedUsers(prev => prev.map(user => 
        user.userId === data.userId 
          ? { ...user, cursor: { position: data.position, selection: data.selection } }
          : user
      ));
    };
    
    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('user-joined', handleUserJoined);
    socket.on('existing-users', handleExistingUsers);
    socket.on('user-left', handleUserLeft);
    socket.on('cursor-position', handleCursorPosition);
    
    // Socket connection will trigger handleConnect which emits join-room
    // No need to emit join-room here as it would cause duplicate joins
    
    return () => {
      // Clear connection timeout if still pending
      if (socketConnectTimeout) {
        clearTimeout(socketConnectTimeout);
      }
      
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('user-joined', handleUserJoined);
      socket.off('existing-users', handleExistingUsers);
      socket.off('user-left', handleUserLeft);
      socket.off('cursor-position', handleCursorPosition);
      
      // Only disconnect if we created the socket
      if (!providedSocket && socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [roomId, userColors, providedSocket, userName, onSocketReady]);

  // Notify parent when connected users change
  useEffect(() => {
    if (onConnectedUsersChange) {
      onConnectedUsersChange(connectedUsers);
    }
  }, [connectedUsers, onConnectedUsersChange]);

  // Set initial content when editor is ready and connected
  useEffect(() => {
    // CRITICAL: Wait for Yjs to complete initial sync before setting content
    // This prevents race condition where DB content overwrites live edits
    if (quillRef.current && isConnected && initialContent && !isLoading && ydocRef.current && isSynced) {
      const editor = quillRef.current.getEditor();
      const currentContent = editor.root.innerHTML;
      
      // Check if Yjs document already has content (from other users)
      const ytext = ydocRef.current.getText('quill');
      const yjsContent = ytext.toString();
      
      console.log('📄 Initial content from DB:', initialContent.substring(0, 100));
      console.log('📝 Current editor content:', currentContent);
      console.log('🔄 Yjs synced content length:', yjsContent.length);
      console.log('✅ Yjs sync completed:', isSynced);
      
      // Only set content from database if:
      // 1. Editor is empty or contains default content
      // 2. AND Yjs document is also empty (no one else is editing)
      // 3. AND Yjs has completed initial sync (to avoid race condition)
      const isEditorEmpty = currentContent === '<p><br></p>' || currentContent === '' || currentContent === '<p></p>';
      const isYjsEmpty = yjsContent.length === 0 || yjsContent === '\n';
      
      if (isEditorEmpty && isYjsEmpty) {
        // Use a timeout to ensure the editor is fully ready and prevent addRange warnings
        const contentTimeout = setTimeout(() => {
          if (!quillRef.current || contentSetRef.current) return;
          
          try {
            const editor = quillRef.current.getEditor();
            
            // Check if content contains HTML tags
            if (initialContent.includes('<') && initialContent.includes('>')) {
              // Content is HTML, use dangerouslyPasteHTML
              console.log('🔽 Setting HTML content from database (no one else editing)');
              editor.clipboard.dangerouslyPasteHTML(initialContent);
            } else {
              // Content is plain text, use setText
              console.log('🔽 Setting plain text content from database (no one else editing)');
              editor.setText(initialContent);
            }
            
            contentSetRef.current = true;
          } catch (error) {
            console.error('Error setting initial content:', error);
            // Fallback: set as plain text
            editor.setText(initialContent.replace(/<[^>]*>/g, ''));
          }
        }, 500); // Wait 500ms for editor to be fully ready
        
        return () => clearTimeout(contentTimeout);
      } else if (!isYjsEmpty) {
        console.log('🚫 Yjs already has synced content from other users, skipping database content');
        contentSetRef.current = true; // Mark as set to prevent future attempts
      }
    }
  }, [isConnected, initialContent, isLoading, isSynced]);

  // Removed visibility change handler to prevent connection loops

  // Manual retry function
  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setIsSynced(false); // Reset sync flag
    isInitializedRef.current = false;
    contentSetRef.current = false; // Reset content flag
    
    // Force re-initialization
    setTimeout(() => {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      isInitializedRef.current = false;
      contentSetRef.current = false;
    }, 100);
  }, []);

  // Handle content changes
  const handleContentChange = useCallback((content: string) => {
    // Content is automatically synced through Yjs
    // This is just for any additional handling you might need
  }, []);


  // Quill editor configuration
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
  }), []);

  const quillFormats = useMemo(() => [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'link', 'image', 'blockquote', 'code-block'
  ], []);

  // Show error state
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        padding: '20px',
        backgroundColor: '#f8d7da',
        borderRadius: '8px',
        color: '#721c24'
      }}>
        <h5>Collaborative Editor Error</h5>
        <p>{error}</p>
        <button
          onClick={handleRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#721c24',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        fontSize: '18px',
        color: '#666'
      }}>
        <div>
          <div style={{ marginBottom: '10px' }}>Loading collaborative editor...</div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            Connecting to: {roomId}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Disconnected Label - Only show when disconnected */}
      {!isConnected && (
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          Disconnected
        </div>
      )}

      {/* Editor Container */}
      <div style={{ 
        flex: 1,
        position: 'relative',
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '400px', // Ensure minimum height
        marginBottom: '20px' // Add space below the entire editor container
      }}>
        {/* Quill Editor */}
        <div style={{ 
          flex: 1, 
          minHeight: '300px',
          position: 'relative'
        }}>
          <ReactQuill
            ref={quillRef}
            onChange={handleContentChange}
            modules={quillModules}
            formats={quillFormats}
            style={{ 
              height: '100%',
              backgroundColor: 'white'
            }}
            theme="snow"
            readOnly={!isConnected}
          />
          
          {/* User Cursors Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 10
          }}>
            {connectedUsers.map(user => (
              user.cursor && (
                <div
                  key={user.userId}
                  style={{
                    position: 'absolute',
                    left: `${user.cursor.position * 8}px`, // Approximate character width
                    top: '10px',
                    width: '2px',
                    height: '20px',
                    backgroundColor: user.color,
                    borderRadius: '1px',
                    opacity: 0.8
                  }}
                />
              )
            ))}
          </div>
        </div>
        
        {/* Save Button at Bottom */}
        <div style={{
          padding: '10px',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#f8f9fa',
          flexShrink: 0, // Prevent shrinking
          zIndex: 20 // Ensure it's above other elements
        }}>
          <button
            type="button"
            className="btn"
            style={{ 
              borderColor: "#213555", 
              color: "white",
              backgroundColor: "#213555"
            }}
            onClick={() => {
              if (quillRef.current && onSave) {
                const content = quillRef.current.getEditor().root.innerHTML;
                onSave(content);
              }
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeEditor;