import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getConversations, getProjectMessages, getContacts, sendMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, User, FolderKanban } from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchParams.get('project')) {
      selectProject(searchParams.get('project'));
    }
  }, [searchParams]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    try {
      const [convsRes, contactsRes] = await Promise.all([
        getConversations(),
        getContacts(),
      ]);
      setConversations(convsRes.data);
      setContacts(contactsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectProject = async (projectId) => {
    try {
      const res = await getProjectMessages(projectId);
      setMessages(res.data);
      setSelectedConversation({ type: 'project', id: projectId });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const selectContact = async (contactId) => {
    try {
      const res = await getUserMessages(contactId);
      setMessages(res.data);
      setSelectedConversation({ type: 'user', id: contactId });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const data = {
        message: newMessage,
      };
      if (selectedConversation?.type === 'project') {
        data.project_id = selectedConversation.id;
      } else if (selectedConversation?.type === 'user') {
        data.receiver_id = selectedConversation.id;
      }
      
      await sendMessage(data);
      setNewMessage('');
      
      // Refresh messages
      if (selectedConversation?.type === 'project') {
        selectProject(selectedConversation.id);
      } else {
        selectContact(selectedConversation.id);
      }
    } catch (error) {
      alert('حدث خطأ في إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex overflow-hidden">
        {/* Conversations list */}
        <div className="w-80 border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">المحادثات</h2>
          </div>
          
          {/* Project conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 && (
              <div className="p-2">
                <p className="text-xs text-slate-500 px-2 py-1">مشاريع</p>
                {conversations.map((conv) => (
                  <button
                    key={conv.project_id}
                    onClick={() => selectProject(conv.project_id)}
                    className={`w-full text-right p-3 rounded-xl mb-1 transition-colors ${
                      selectedConversation?.type === 'project' && selectedConversation?.id === conv.project_id
                        ? 'bg-primary-50 text-primary-700'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                        <FolderKanban className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{conv.project_name}</p>
                        <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Direct contacts */}
            <div className="p-2 border-t border-slate-200">
              <p className="text-xs text-slate-500 px-2 py-1">جهات الاتصال</p>
              {contacts.filter(c => c.role !== 'client').map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => selectContact(contact.id)}
                  className={`w-full text-right p-3 rounded-xl mb-1 transition-colors ${
                    selectedConversation?.type === 'user' && selectedConversation?.id === contact.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="font-medium text-slate-900">{contact.name}</p>
                      <p className="text-xs text-slate-500">{contact.role}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">
                  {selectedConversation.type === 'project' 
                    ? conversations.find(c => c.project_id === selectedConversation.id)?.project_name
                    : contacts.find(c => c.id === selectedConversation.id)?.name}
                </h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user.id ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.sender_id === user.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}>
                      <p>{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender_id === user.id ? 'text-primary-200' : 'text-slate-400'
                      }`}>
                        {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-slate-200">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="اكتب رسالة..."
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">اختر محادثة لعرض الرسائل</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}